"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Cropper, { Area } from 'react-easy-crop'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { User, Mail, Camera, Pencil, ZoomIn } from "lucide-react"
import NavBarComponent from "components/NavBar/NavBarComponent"
import { supabase } from "@/lib/supabase"
import Loading from "components/Loading/Loading"

type AlunoInfo = {
  nome: string
  email: string
  fotoPerfil: string
}

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.5 } }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function PerfilAluno() {
  const [editando, setEditando] = useState(false)
  const [imagemTemp, setImagemTemp] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [alunoInfo, setAlunoInfo] = useState<AlunoInfo>({
    nome: '',
    email: '',
    fotoPerfil: "/logo.png"
  })
  const [novaInfo, setNovaInfo] = useState<AlunoInfo>(alunoInfo)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Erro ao obter usuário logado:", userError);
          return;
        }

  
        if (user) {
          const userEmail = user.email;
          const { data, error } = await supabase
            .from("Aluno")
            .select("name, email, perfil")
            .eq("email", userEmail);
  
          if (error) {
            console.error("Erro ao buscar as informações do usuário:", error);
          } else if (data && data.length > 0) {
            const fetchedAlunoInfo = data[0];
            setAlunoInfo({
              nome: fetchedAlunoInfo.name,
              email: fetchedAlunoInfo.email,
              fotoPerfil: fetchedAlunoInfo.perfil && fetchedAlunoInfo.perfil !== '' 
                ? fetchedAlunoInfo.perfil 
                : "/placeholder.svg?height=128&width=128",
              
            });
            setNovaInfo({
              nome: fetchedAlunoInfo.name,
              email: fetchedAlunoInfo.email,
              fotoPerfil: fetchedAlunoInfo.perfil && fetchedAlunoInfo.perfil !== '' 
                ? fetchedAlunoInfo.perfil 
                : "/placeholder.svg?height=128&width=128",
            });

          }
        }
      } catch (error) {
        console.error("Erro durante o fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  

  const handleEdit = () => {
    setEditando(true)
    setNovaInfo(alunoInfo) // Carregar as informações atuais no estado de edição
  }

  const handleSave = async () => {
    try {
      let fotoPerfilUrl = alunoInfo.fotoPerfil;
  
      // Verifica se há uma sessão ativa
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError || !sessionData || !sessionData.session) {
        console.error('Usuário não autenticado ou sessão inválida');
        return;
      }
  
      // Obtém o UID do usuário da sessão
      const user = sessionData.session.user;
  
      if (!user || !user.id) {
        console.error('Erro ao obter o usuário autenticado ou o UID está indefinido');
        return;
      }
  
      if (novaInfo.fotoPerfil !== alunoInfo.fotoPerfil && novaInfo.fotoPerfil.startsWith("blob:")) {
        // Se uma nova imagem foi selecionada e cortada
        const response = await fetch(novaInfo.fotoPerfil);
        const blob = await response.blob();
        const fileExt = blob.type.split('/')[1];
  
        // Use o UID ao invés do email no nome da pasta e arquivo
        const fileName = `${user.id}/profile.${fileExt}`;
  
        // Faz o upload da imagem para o Supabase Storage no bucket "avatars"
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            upsert: true,
            contentType: blob.type,
          });
          if (data) {
            console.log("Data:", data);
          }
  
        if (error) {
          console.error("Erro ao fazer upload da imagem:", error);
          return;
        }
  
        // Pega a URL pública da imagem no bucket "avatars"
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
        fotoPerfilUrl = publicUrl.publicUrl;
      }
  
      // Atualiza os dados do aluno no banco de dados
      const { error } = await supabase
        .from('Aluno')
        .update({
          name: novaInfo.nome,
          email: novaInfo.email,
          perfil: fotoPerfilUrl,
        })
        .eq('email', alunoInfo.email);
  
      if (error) {
        console.error('Erro ao atualizar as informações do aluno:', error);
      } else {
        setAlunoInfo(novaInfo); // Atualiza o estado com as novas informações
        setEditando(false); // Sai do modo de edição
      }
    } catch (error) {
      console.error('Erro ao salvar as alterações:', error);
    }
  };
  
  
  
  
  const handleCancel = () => {
    setEditando(false)
    setNovaInfo(alunoInfo)
    setImagemTemp(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagemTemp(reader.result as string)
        setShowCropDialog(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
    console.log(croppedArea)
  }, []);
  


  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

    const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string | null> => {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return null;
      }
    
      const size = Math.min(pixelCrop.width, pixelCrop.height);
      canvas.width = size;
      canvas.height = size;
    
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
      );
    
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          resolve(URL.createObjectURL(blob));
        }, 'image/png');
      });
    };
    

  const handleCropSave = async () => {
    if (imagemTemp && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imagemTemp, croppedAreaPixels)
      setNovaInfo({ ...novaInfo, fotoPerfil: croppedImage as string })
      setShowCropDialog(false)
      setImagemTemp(null)
    }
  }

  return (
    <div className="flex min-h-screen">
        {isLoading && (
            <Loading/>
        )}
    <NavBarComponent/>
    <AnimatePresence>
      <motion.div 
        className="flex-1 min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="max-w-3xl mx-auto"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.h1 
            className="text-4xl font-bold text-center mb-8 text-green-800"
            variants={fadeInUp}
          >
            Perfil do Aluno
          </motion.h1>
          <motion.div variants={fadeInUp}>
            <Card className="w-full shadow-lg overflow-hidden">
              <motion.div
                initial={{ backgroundColor: "#22c55e" }}
                animate={{ backgroundColor: "#16a34a" }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                  <CardTitle className="text-2xl text-center">Informações Pessoais</CardTitle>
                  <CardDescription className="text-green-100 text-center">Visualize e edite seus dados</CardDescription>
                </CardHeader>
              </motion.div>
              <CardContent className="pt-6">
                <motion.div 
                  className="flex flex-col items-center mb-6"
                  variants={fadeInUp}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar className="w-40 h-40 border-4 border-green-500 shadow-lg">
                      <AvatarImage src={editando ? novaInfo.fotoPerfil : alunoInfo.fotoPerfil} alt="Foto de perfil" />
                      <AvatarFallback className="bg-green-200 text-green-600">
                        <User className="w-20 h-20" />
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <AnimatePresence>
                    {editando && (
                      <motion.div 
                        className="mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Label htmlFor="foto-perfil" className="cursor-pointer bg-green-600 text-white py-2 px-4 rounded-full hover:bg-green-700 transition-colors flex items-center shadow-md">
                          <Camera className="mr-2" />
                          Alterar Foto
                        </Label>
                        <Input
                          id="foto-perfil"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div className="space-y-6" variants={stagger}>
                  <motion.div className="space-y-2" variants={fadeInUp}>
                    <Label htmlFor="nome" className="text-green-700 font-semibold">Nome</Label>
                    <div className="relative">
                      <Input
                        id="nome"
                        value={editando ? novaInfo.nome : (alunoInfo.nome || "")}
                        onChange={(e) => setNovaInfo({ ...novaInfo, nome: e.target.value })}
                        disabled={!editando}
                        className="pl-10 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                    </div>
                  </motion.div>
                  <motion.div className="space-y-2" variants={fadeInUp}>
                    <Label htmlFor="email" className="text-green-700 font-semibold">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={editando ? novaInfo.email : (alunoInfo.email || "")}
                        onChange={(e) => setNovaInfo({ ...novaInfo, email: e.target.value })}
                        disabled={!editando}
                        className="pl-10 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                    </div>
                  </motion.div>
                </motion.div>
              </CardContent>
              <CardFooter className="flex justify-center space-x-2 bg-green-50 rounded-b-lg">
                <AnimatePresence mode="wait">
                  {!editando ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button onClick={handleEdit} className="bg-green-600 hover:bg-green-700 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Perfil
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="save-cancel"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex space-x-2"
                    >
                      <Button onClick={handleCancel} variant="outline" className="border-green-500 text-green-600 hover:bg-green-100">
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                        Salvar
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajustar Imagem</DialogTitle>
            <DialogDescription>
              Arraste e redimensione a imagem para criar seu avatar circular.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-64">
            {imagemTemp && (
              <Cropper
                image={imagemTemp}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <ZoomIn className="text-green-600" />
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-grow"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCropDialog(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleCropSave} className="bg-green-600 hover:bg-green-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
    </div>
  )
}
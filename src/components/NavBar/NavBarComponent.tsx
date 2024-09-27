import { supabase } from '@/lib/supabase';
import { Button } from 'components/ui/button'
import { BookOpen, GraduationCap, Home, LogOut, Menu, User } from 'lucide-react'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'



const NavBarComponent = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const navigate = useNavigate()

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
      };

      const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
    
        if (error) {
          console.error('Erro ao realizar logout:', error);
        } else {
          console.log('Logout realizado com sucesso');
          // Redirecionar ou atualizar o estado da aplicação conforme necessário
          navigate('/')
        }
      };

  return (
    <>
    <nav
    className={`w-64 h-screen bg-white shadow-md fixed inset-y-0 left-0 transform ${
      isNavOpen ? "translate-x-0" : "-translate-x-full"
    } lg:translate-x-0 transition-transform duration-200 ease-in-out lg:relative z-40`}
    >
    <div className="p-4 bg-green-600">
      <h2 className="text-2xl font-bold text-white">Portal do Aluno</h2>
    </div>
    <ul className="space-y-2 p-4">
      <li>
      <Link to={'/Home'}>
        <Button
          variant="ghost"
          className="w-full justify-start text-green-700 hover:bg-green-100 hover:text-green-800"
        >
          <Home className="mr-2 h-4 w-4" />
          Início
          
        </Button>
        </Link>
      </li>
      <li>
      <Link to={'/Home/activites'}>
        <Button
          variant="ghost"
          className="w-full justify-start text-green-700 hover:bg-green-100 hover:text-green-800"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Atividades
          
        </Button>
        </Link>
      </li>
      <li>
        <Button
          variant="ghost"
          className="w-full justify-start text-green-700 hover:bg-green-100 hover:text-green-800"
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Notas
        </Button>
      </li>

      <li>
        <Link to={'/home/perfil'}>
        <Button
          variant="ghost"
          className="w-full justify-start text-green-700 hover:bg-green-100 hover:text-green-800"
        >
          <User className="mr-2 h-4 w-4" />
          Perfil
        </Button>
        </Link>
      </li>
    </ul>
    <div className="p-4 mt-auto">
      <Button
        variant="outline"
        className="w-full border-green-600 text-green-600 hover:bg-green-50"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  </nav>
    {isNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsNavOpen(false)}
        ></div>
      )}
                <Button
            variant="outline"
            size="icon"
            className={`fixed top-0.5 text-black bg-green-800 left-0.5 rounded-full z-50 lg:hidden ${
              isNavOpen ? "hidden" : ""
            }`}
            onClick={toggleNav}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only ">Toggle navigation menu</span>
          </Button>
  </>
)
}

export default NavBarComponent
import AuthComponent from 'components/AuthComponent/AuthComponent';
import Activities from '@/pages/Activities/Activities';
import HomePage from '@/pages/Home/home.tsx';
import PrivateRoute from 'components/PrivateRoute/PrivateRoute';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PerfilAluno from '@/pages/Perfil/perfil';
import PaginaNotas from '@/pages/Notas/notas';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthComponent />} />
        <Route path='/home' element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
          }></Route>
        <Route path='/activites' element={
          <PrivateRoute>
            <Activities/>
          </PrivateRoute>
          }></Route>
        <Route path='/perfil' element={
          <PrivateRoute>
            <PerfilAluno/>
          </PrivateRoute>
          }></Route>
        <Route path='/nota' element={
          <PrivateRoute>
            <PaginaNotas/>
          </PrivateRoute>
          }></Route>
      </Routes>
    </Router>
  );
};

export default App;

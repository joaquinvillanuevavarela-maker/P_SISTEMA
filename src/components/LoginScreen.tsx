  /**
   * @license
   * SPDX-License-Identifier: Apache-2.0
   */
  
  import React, { useState } from 'react';
  import { yogaAuth, yogaDatabase } from '../firebase';
  import { UserRole } from '../types';
  import { Compass, Sparkles, User, ShieldCheck, Mail, LogIn, BookOpen, Key, Eye, EyeOff, Info, ArrowLeft } from 'lucide-react';
  import { motion } from 'motion/react';
  
  interface LoginScreenProps {
    onLoginSuccess: () => void;
  }
  
  function getPasswordFromRut(rut: string): string {
    const clean = rut.replace(/\./g, '').trim();
    if (clean.includes('-')) {
      const parts = clean.split('-');
      const beforeDash = parts[0];
      return beforeDash.substring(Math.max(0, beforeDash.length - 6));
    } else {
      const beforeLast = clean.substring(0, clean.length - 1);
      return beforeLast.substring(Math.max(0, beforeLast.length - 6));
    }
  }
  
  export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // High fidelity step: Select Admin, Alumno or Profesor
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
  
    const [dbInstructors, setDbInstructors] = useState<{ displayName: string; email: string; passwordHint: string }[]>([
      { displayName: 'Sofía', email: 'sofia@yoga.com', passwordHint: '345678' },
      { displayName: 'Matías', email: 'matias@yoga.com', passwordHint: '345678' },
      { displayName: 'Camila', email: 'camila@yoga.com', passwordHint: '345678' },
      { displayName: 'Lucas', email: 'lucas@yoga.com', passwordHint: '345678' },
    ]);
  
    React.useEffect(() => {
      let active = true;
      yogaDatabase.getAllUsers().then(usersList => {
        if (!active) return;
        const filtered = usersList
          .filter(u => u.role === 'instructor')
          .map(u => {
            const expectedPassword = u.rut ? getPasswordFromRut(u.rut) : '1234';
            return {
              displayName: u.displayName,
              email: u.email,
              passwordHint: expectedPassword
            };
          });
        if (filtered.length > 0) {
          setDbInstructors(filtered);
        }
      }).catch(err => {
        console.error('Error fetching instructors for guide:', err);
      });
      return () => {
        active = false;
      };
    }, []);
  
    // Admin registration form (for testing/adding user profiles directly)
    const [customEmail, setCustomEmail] = useState('');
    const [customName, setCustomName] = useState('');
    const [customRut, setCustomRut] = useState('');
    const [customRole, setCustomRole] = useState<UserRole>('student');
    const [showRegisterForm, setShowRegisterForm] = useState(false);
  
    const handleCredentialsLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginEmail || !loginPassword) {
        setError('Por favor ingresa tu correo electrónico y contraseña.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // 1. Get all users
        const allUsers = await yogaDatabase.getAllUsers();
        
        // 2. Find matching profile (case-insensitive)
        const matchedUser = allUsers.find(
          (u) => u.email.trim().toLowerCase() === loginEmail.trim().toLowerCase()
        );
  
        if (!matchedUser) {
          setError(
            'El correo electrónico no está registrado. Solicita a Valentina (Administradora) que registre tu correo en el sistema.'
          );
          setLoading(false);
          return;
        }
  
        // 3. Force alignment with selected initial login role to prevent mistakes
        if (selectedRole && matchedUser.role !== selectedRole) {
          const roleLabelSelected = selectedRole === 'admin' ? 'Administrador/a' : selectedRole === 'instructor' ? 'Profesor/a' : 'Alumno/a';
          const roleLabelActual = matchedUser.role === 'admin' ? 'Administrador/a' : matchedUser.role === 'instructor' ? 'Profesor/a' : 'Alumno/a';
          setError(
            `Este correo pertenece a un perfil de "${roleLabelActual}", pero seleccionaste ingresar como "${roleLabelSelected}". Por favor regresa y selecciona tu perfil correcto.`
          );
          setLoading(false);
          return;
        }
  
        // 4. Log in with Firebase Authentication
        await yogaAuth.signInWithEmail(loginEmail, loginPassword);
        onLoginSuccess();
    
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ocurrió un error al verificar tus credenciales. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
  
    const handleCreateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!customEmail || !customName || !customRut) {
        setError('Por favor completa todos los campos, incluyendo el RUT.');
        return;
      }
      
      // Validate RUT format roughly
      const cleanRut = customRut.trim();
      if (!/^[0-9]+-?[0-9Kk]$/.test(cleanRut.replace(/\./g, ''))) {
        setError('Por favor ingresa un RUT válido con guión y dígito verificador (ej: 22123456-5).');
        return;
      }
  
      setLoading(true);
      try {
        // Create user profile directly
        const userId = `custom_user_${Date.now()}`;
        const newProfile = {
          userId,
          email: customEmail.trim().toLowerCase(),
          displayName: customName.trim(),
          role: customRole,
          createdAt: new Date().toISOString(),
          rut: cleanRut
        };
        
        await yogaDatabase.saveUserProfile(newProfile);
        
        // Log in right away
        await yogaAuth.simulateUserLogin(newProfile.email, newProfile.role, newProfile.displayName);
        onLoginSuccess();
      } catch (err: any) {
        setError('Ocurrió un error al registrar el usuario.');
      } finally {
        setLoading(false);
      }
    };
  
    // Helper helper config based on role selection
    const getHelperExamples = () => {
      if (selectedRole === 'admin') {
        return (
          <>
            <p className="text-[11px] text-emerald-900/80 leading-normal font-mono bg-emerald-50/50 p-1.5 rounded border border-emerald-100/40">
              Ingreso administrativo para Valentina (RUT: <strong>22222222-2</strong>)
            </p>
            <p className="text-[10px] text-emerald-850 font-mono italic">
              Email: <strong>valentina@gmail.com</strong> &rarr; Clave: <strong>222222</strong>
            </p>
          </>
        );
      } else if (selectedRole === 'instructor') {
        return (
          <>
            <p className="text-[11px] text-emerald-900/80 leading-normal">
              Su contraseña son los <strong>últimos 6 dígitos</strong> de su RUT antes del guión.
            </p>
            <div className="text-[10px] text-emerald-850 space-y-1 font-mono italic max-h-[100px] overflow-y-auto pr-1">
              {dbInstructors.map((inst, idx) => (
                <p key={idx}>
                  {inst.displayName}: <strong>{inst.email}</strong> &rarr; Clave: <strong>{inst.passwordHint}</strong>
                </p>
              ))}
            </div>
          </>
        );
      } else {
        return (
          <>
            <p className="text-[11px] text-emerald-950 bg-emerald-50/40 p-1.5 rounded border border-emerald-100/40 leading-normal">
              Su contraseña son los <strong>últimos 6 dígitos</strong> de su RUT (antes del guión).
            </p>
            <div className="text-[10px] text-emerald-850 space-y-0.5 font-mono italic mt-1">
              <p className="text-emerald-950 font-semibold">Demo Joaquín: <strong>joaquinvillanuevavarela@gmail.com</strong> &rarr; Clave: <strong>286220</strong></p>
              
            </div>
          </>
        );
      }
    };
  
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex flex-col justify-between font-sans antialiased relative overflow-hidden">
        {/* Background Shapes for Mesh Effect */}
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#e0f0e3] rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-[#f8ede3] rounded-full blur-[150px] opacity-60 pointer-events-none" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-[#e9e4ff] rounded-full blur-[100px] opacity-40 pointer-events-none" />
  
        {/* Main Container */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-8"
          >
            {/* Logo Heading */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600/10 text-emerald-700 border border-white/50 mb-4 animate-pulse">
                <Compass className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-semibold text-emerald-950 tracking-tight">
                Yoga de Corazón
              </h1>
              <p className="text-emerald-800/70 text-xs mt-1">
                Estudio de Yoga Valentina • Práctica en Armonía
              </p>
            </div>
  
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/60 backdrop-blur-md border border-red-200/50 text-red-700 text-xs leading-relaxed text-left">
                {error}
              </div>
            )}
  
            {showRegisterForm ? (
              /* SANDBOX REGISTER FORM */
              <form onSubmit={handleCreateAccount} className="space-y-4 text-left">
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Registrar Cliente de Prueba
                </h3>
  
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Valeria Mendoza"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur"
                  />
                </div>
  
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. valeria@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur"
                  />
                </div>
  
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">RUT (Formato: 22123456-5)</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 22123456-5"
                    value={customRut}
                    onChange={(e) => setCustomRut(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur"
                  />
                </div>
  
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCustomRole('student')}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                      customRole === 'student'
                        ? 'bg-emerald-600/20 text-emerald-950 border-emerald-500/40 shadow-sm'
                        : 'bg-white/30 text-slate-500 border-white/30 hover:bg-white/50'
                    }`}
                  >
                    Alumno o Alumna
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole('instructor')}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                      customRole === 'instructor'
                        ? 'bg-emerald-600/20 text-emerald-950 border-emerald-500/40 shadow-sm'
                        : 'bg-white/30 text-slate-500 border-white/30 hover:bg-white/50'
                    }`}
                  >
                    Profesor o Profesora
                  </button>
                </div>
  
                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterForm(false);
                      setError(null);
                    }}
                    className="flex-1 py-2 bg-white/30 border border-white/30 rounded-lg text-xs text-slate-700 hover:bg-white/50 transition-colors font-medium cursor-pointer"
                  >
                    Regresar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs transition-colors font-semibold shadow-sm cursor-pointer"
                  >
                    {loading ? 'Creando...' : 'Crear e Iniciar'}
                  </button>
                </div>
              </form>
            ) : selectedRole === null ? (
              /* USER INTENT STET 1: CHOOSE ADMIN, ALUMNO, PROFESOR (AS BEFORE) */
              <div className="space-y-4 text-left">
                <p className="text-emerald-950/75 text-xs font-extrabold text-center block mb-4 uppercase tracking-wider">
                  Selecciona tu perfil para ingresar:
                </p>
  
                {/* STUDENT / ALUMNO */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('student');
                    setError(null);
                  }}
                  className="w-full text-left p-4 rounded-xl bg-white/60 hover:bg-white border border-emerald-100/60 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-sm group-hover:text-emerald-900 transition-colors">
                        Alumno / Alumna
                      </h4>
                      <p className="text-[10px] text-emerald-800/80 mt-0.5">
                        Reserva tus clases, revisa pases y asiste.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-850 uppercase tracking-widest bg-emerald-100/50 px-2 py-1 rounded-md opacity-80 group-hover:opacity-100 group-hover:bg-emerald-100">
                    Ingresar
                  </span>
                </button>
  
                {/* PROFESOR / INSTRUCTOR */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('instructor');
                    setError(null);
                  }}
                  className="w-full text-left p-4 rounded-xl bg-white/60 hover:bg-white border border-emerald-100/60 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-sm group-hover:text-emerald-900 transition-colors">
                        Profesor o Profesora
                      </h4>
                      <p className="text-[10px] text-emerald-800/80 mt-0.5">
                        Ver horarios y administrar asistencia real.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-850 uppercase tracking-widest bg-emerald-100/50 px-2 py-1 rounded-md opacity-80 group-hover:opacity-100 group-hover:bg-emerald-100">
                    Ingresar
                  </span>
                </button>
  
                {/* ADMIN */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setError(null);
                  }}
                  className="w-full text-left p-4 rounded-xl bg-white/50 hover:bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-705 group-hover:bg-[#064e3b] group-hover:text-white transition-all shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#064e3b] text-sm group-hover:text-emerald-900 transition-colors">
                        Administradora (Valentina)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Estadísticas de ingresos y control global de clases y alumnos.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md opacity-80 group-hover:opacity-100 group-hover:bg-emerald-100">
                    Ingresar
                  </span>
                </button>
  
                <div className="pt-2 text-center">
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    ¿Eres nuevo estudiante? Solicita tu registro a Valentina o regístrate en modo sandbox.
                  </p>
                  {yogaAuth.isMockMode() && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegisterForm(true);
                        setCustomRole('student');
                      }}
                      className="text-xs text-emerald-855 hover:text-emerald-950 hover:underline font-extrabold transition-colors mt-2"
                    >
                      🚀 Crear un cliente nuevo sandbox
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* USER INTENT STET 2: ENTER CREDENTIALS WITH RUT/PASSWORD HELPERS */
              <form onSubmit={handleCredentialsLogin} className="space-y-5 text-left">
                {/* Back breadcrumb bar */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-emerald-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null);
                      setError(null);
                    }}
                    className="p-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-black text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Atrás
                  </button>
                  <span className="text-[10.5px] font-black text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                    Ingreso: {selectedRole === 'admin' ? 'Administrador' : selectedRole === 'instructor' ? 'Profesor' : 'Alumno'}
                  </span>
                </div>
  
                <div className="space-y-2">
                  <label className="text-xs font-black text-emerald-950/80 uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="ej. lucia@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                    />
                  </div>
                </div>
  
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-emerald-950/80 uppercase tracking-wider block">
                      Contraseña
                    </label>
                    {selectedRole !== 'admin' && (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-100">
                        4 dígitos de tu RUT
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={selectedRole === 'admin' ? 'Contraseña del administrador' : 'Últimos 6 dígitos del RUT antes del guión'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-white/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
  
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
  
                {/* Specific Helpers based on chosen Role */}
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 space-y-1.5 backdrop-blur-sm">
                  <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-700" />
                    Instrucciones de Acceso ({selectedRole === 'admin' ? 'Admin' : selectedRole === 'instructor' ? 'Profesor' : 'Alumno'})
                  </h4>
                  {getHelperExamples()}
                </div>
              </form>
            )}
  
            {/* LocalStorage sandbox text disclosure */}
            <div className="mt-8 flex items-start gap-2 bg-white/20 p-3 rounded-lg border border-white/30 backdrop-blur text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900/80 leading-normal font-medium animate-fade-in">
                {yogaAuth.isMockMode() 
                  ? "Modo Sandbox Activado. Toda la información se guarda de forma segura en el almacenamiento local del navegador para permitir pruebas inmediatas."
                  : "Conexión en Vivo con Firebase Firestore habilitada. Los datos se guardan y consultan en tiempo real."
                }
              </p>
            </div>
          </motion.div>
        </main>
  
        <footer className="py-4 text-center text-xs text-slate-400 relative z-10">
          &copy; {new Date().getFullYear()} Yoga de Corazón. Diseñado para Valentina.
        </footer>
      </div>
    );
}

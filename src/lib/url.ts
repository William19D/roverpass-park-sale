// Determine if we're on Vercel production or other environments
const isVercelProduction = import.meta.env.PROD && window.location.hostname === 'roverpass-park-sale.vercel.app';

// For Vercel deployment we don't need a prefix, for production on RoverPass domain we would
const PATH_PREFIX = isVercelProduction ? '' : '/rv-parks-for-sale';
const DOMAIN = isVercelProduction ? "https://roverpass-park-sale.vercel.app" : "https://roverpass.com";

// Detectar si estamos en un entorno que requiere redirección externa
export const isExternalRedirectRequired = () => {
  // En desarrollo local o en los dominios específicos, no redireccionamos
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  const isTargetDomain = window.location.hostname === 'roverpass.com' ||
                         window.location.hostname === 'roverpass-park-sale.vercel.app';
  
  return !isLocalhost && !isTargetDomain;
};

// Función para generar URLs absolutas para React Router (relativas al basename)
export const absoluteUrl = (path: string): string => {
  // Si la ruta ya empieza con el prefijo, quitarlo para evitar duplicación
  let processedPath = path;
  if (PATH_PREFIX && processedPath.startsWith(PATH_PREFIX)) {
    processedPath = processedPath.substring(PATH_PREFIX.length);
  }
  
  // Asegurarse de que la ruta comience con /
  const normalizedPath = processedPath.startsWith('/') ? processedPath : `/${processedPath}`;
  
  // Para uso dentro de React Router, devolver sin PATH_PREFIX
  return normalizedPath;
};

// Función para generar URLs completas con dominio
export const fullUrl = (path: string): string => {
  const normalizedPath = absoluteUrl(path);
  return `${DOMAIN}${PATH_PREFIX}${normalizedPath}`;
};

// Función para hacer clic en enlaces que puede redirigir externamente
export const handleLinkClick = (e: React.MouseEvent, to: string) => {
  if (isExternalRedirectRequired()) {
    e.preventDefault();
    window.location.href = fullUrl(to);
    return true;
  }
  return false;
};
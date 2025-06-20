// url.ts

// Detect different environments
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';
const isVercelProduction = import.meta.env.PROD && window.location.hostname === 'roverpass-park-sale.vercel.app';
const isRoverPassProduction = window.location.hostname === 'roverpass.com';

// Configuration of prefixes and domains based on environment
export const getPathPrefix = (): string => {
  if (isLocalhost) {
    return ''; // No prefix in local development
  }
  
  if (isVercelProduction) {
    return ''; // No prefix in Vercel
  }
  
  if (isRoverPassProduction) {
    return '/rv-parks-for-sale'; // With prefix in RoverPass
  }
  
  return '/rv-parks-for-sale'; // Default for other production environments
};

export const getDomain = (): string => {
  if (isLocalhost) {
    return window.location.origin; // http://localhost:8080
  }
  
  if (isVercelProduction) {
    return "https://roverpass-park-sale.vercel.app";
  }
  
  if (isRoverPassProduction) {
    return "https://roverpass.com";
  }
  
  return "https://roverpass.com"; // Default
};

const PATH_PREFIX = getPathPrefix();
const DOMAIN = getDomain();

// Detect if we are in an environment that requires external redirection
export const isExternalRedirectRequired = (): boolean => {
  // In local development or on specific domains, we don't redirect
  const isTargetDomain = isLocalhost || isVercelProduction || isRoverPassProduction;
  return !isTargetDomain;
};

// Function to get the basename for React Router
export const getBasename = (): string => {
  return PATH_PREFIX;
};

// Function to generate absolute URLs for React Router (relative to basename)
export const absoluteUrl = (path: string): string => {
  // If the path already starts with the prefix, remove it to avoid duplication
  let processedPath = path;
  if (PATH_PREFIX && processedPath.startsWith(PATH_PREFIX)) {
    processedPath = processedPath.substring(PATH_PREFIX.length);
  }
  
  // Make sure the path starts with /
  const normalizedPath = processedPath.startsWith('/') ? processedPath : `/${processedPath}`;
  
  // For use within React Router, return without PATH_PREFIX as the basename handles it
  return normalizedPath;
};

// Function to generate full URLs with domain and prefix
export const fullUrl = (path: string): string => {
  const normalizedPath = absoluteUrl(path);
  return `${DOMAIN}${PATH_PREFIX}${normalizedPath}`;
};

// Function to generate URLs for <a> href elements (with complete prefix)
export const hrefUrl = (path: string): string => {
  const normalizedPath = absoluteUrl(path);
  return `${PATH_PREFIX}${normalizedPath}`;
};

// Function to handle link clicks that may redirect externally
export const handleLinkClick = (e: React.MouseEvent, to: string): boolean => {
  if (isExternalRedirectRequired()) {
    e.preventDefault();
    window.location.href = fullUrl(to);
    return true;
  }
  return false;
};

// Utility function to check if a URL is external
export const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

// Function to programmatically navigate respecting the environment
export const navigateTo = (path: string): void => {
  if (isExternalRedirectRequired()) {
    window.location.href = fullUrl(path);
  } else {
    // Use React Router navigation if available
    window.location.href = hrefUrl(path);
  }
};

// Function to get the current URL without the prefix (useful for comparisons)
export const getCurrentPath = (): string => {
  let currentPath = window.location.pathname;
  
  if (PATH_PREFIX && currentPath.startsWith(PATH_PREFIX)) {
    currentPath = currentPath.substring(PATH_PREFIX.length);
  }
  
  return currentPath || '/';
};

// Debug: function to display the current configuration (only in development)
export const debugUrlConfig = (): void => {
  if (import.meta.env.DEV) {
    console.log('URL Configuration:', {
      hostname: window.location.hostname,
      isLocalhost,
      isVercelProduction,
      isRoverPassProduction,
      PATH_PREFIX,
      DOMAIN,
      currentPath: getCurrentPath(),
      fullCurrentUrl: fullUrl(getCurrentPath())
    });
  }
};
export function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, path: string) {
  e.preventDefault();
  
  // Extract the hash from the path (e.g., '/#layanan' -> 'layanan')
  const targetId = path.startsWith('/#') ? path.substring(2) : path.substring(1);
  
  if (targetId === '') {
    // If it's the home page, just scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Find the target element
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Calculate the top position with offset for the fixed header
      const headerOffset = 80; // Adjust this value based on your header height
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Smooth scroll to the target element
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update the URL without causing a page reload
      window.history.pushState(null, '', path);
    }
  }
}

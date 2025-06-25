import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    
    // Set the new title
    document.title = title;
    
    // Cleanup function to restore previous title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle; 
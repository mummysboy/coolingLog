/**
 * iOS Download Helper
 * Provides iOS-specific download functionality and user guidance
 */

// Detect if the user is on iOS
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect if the user is on iOS Safari specifically
export const isIOSSafari = (): boolean => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
};

// Show iOS-specific download instructions
export const showIOSDownloadInstructions = (fileType: 'PDF' | 'JPEG'): void => {
  const instructions = isIOSSafari() 
    ? `To save this ${fileType} on iOS Safari:\n\n1. Tap and hold the download link\n2. Select "Download Linked File" or "Save to Files"\n3. Choose your preferred location\n\nAlternatively, tap the share button and select "Save to Files" or "Add to Photos" (for JPEG).`
    : `To save this ${fileType} on iOS:\n\n1. Tap and hold the download link\n2. Select "Download Linked File" or "Save to Files"\n3. Choose your preferred location\n\nAlternatively, tap the share button and select "Save to Files" or "Add to Photos" (for JPEG).`;
  
  alert(instructions);
};

// Enhanced download function for iOS compatibility
export const downloadFileIOSCompatible = (
  blob: Blob, 
  filename: string, 
  fileType: 'PDF' | 'JPEG' = 'PDF'
): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Add to DOM, trigger click, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  
  // Show iOS-specific instructions if on iOS
  if (isIOS()) {
    setTimeout(() => {
      showIOSDownloadInstructions(fileType);
    }, 1000);
  }
};

// Alternative method for iOS - open in new tab for manual save
export const downloadFileIOSCompatibleWithFallback = (
  blob: Blob, 
  filename: string, 
  fileType: 'PDF' | 'JPEG' = 'PDF'
): void => {
  if (isIOS()) {
    // On iOS, try the standard download first, then provide fallback
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show instructions immediately for iOS users
    setTimeout(() => {
      showIOSDownloadInstructions(fileType);
      
      // Also offer to open in new tab as fallback
      const openInNewTab = confirm(
        `If the download didn't work, would you like to open the ${fileType} in a new tab where you can manually save it?`
      );
      
      if (openInNewTab) {
        openFileInNewTab(blob, filename);
      }
    }, 500);
    
    // Clean up URL after delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } else {
    // For non-iOS devices, use standard download
    downloadFileIOSCompatible(blob, filename, fileType);
  }
};

// Alternative method for iOS - open in new tab for manual save
export const openFileInNewTab = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  
  if (newWindow) {
    newWindow.document.title = filename;
    // Clean up URL after window is closed or after 30 seconds
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 30000);
  } else {
    // Fallback if popup was blocked
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};

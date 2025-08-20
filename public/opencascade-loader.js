// OpenCascade.js 로더 스크립트
window.initOpenCascade = null;

(async function() {
  try {
    const script = document.createElement('script');
    script.src = '/opencascade.js';
    script.async = true;
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    // opencascade.js가 로드되면 전역 initOpenCascade 함수가 생성됨
    if (window.opencascade) {
      window.initOpenCascade = window.opencascade;
    }
  } catch (error) {
    console.error('Failed to load OpenCascade.js:', error);
  }
})();
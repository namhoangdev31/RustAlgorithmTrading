(function() {
  const script = document.currentScript;
  const bundleId = script ? script.getAttribute('data-bundle-id') : null;
  const version = script ? script.getAttribute('data-version') : '1.0.0';

  if (!bundleId) {
    console.warn('[LepoS Vitals] Missing data-bundle-id attribute.');
    return;
  }

  const sessionId = Math.random().toString(36).substring(2, 15);
  const vitalsUrl = '/api/analytics/vitals';

  function sendVital(name, value) {
    const payload = JSON.stringify({
      bundleId,
      name,
      value,
      version,
      sessionId
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, payload);
    } else {
      fetch(vitalsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  }

  // Simple performance observer for core web vitals
  try {
    // 1. LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      sendVital('LCP', lastEntry.startTime);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. FID (First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        sendVital('FID', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // 3. CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendVital('CLS', clsValue);
      }
    });
  } catch (e) {
    console.warn('[LepoS Vitals] PerformanceObserver not supported in this browser.', e);
  }
})();

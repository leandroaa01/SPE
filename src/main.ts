import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// If Bootstrap JS is loaded via CDN (bundle), expose its API from window.bootstrap.
// Some Bootstrap features (tooltips/popovers) require explicit initialization.
function initBootstrapPlugins() {
  const bs = (window as any).bootstrap;
  if (!bs) return;

  const init = () => {
    // Tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el: Element) => {
      try {
        if (!(el as any).__bs_tooltip) {
          (el as any).__bs_tooltip = new bs.Tooltip(el);
        }
      } catch (e) { /* ignore */ }
    });
    // Popovers
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el: Element) => {
      try {
        if (!(el as any).__bs_popover) {
          (el as any).__bs_popover = new bs.Popover(el);
        }
      } catch (e) { /* ignore */ }
    });
  };

  // Run once on load
  init();

  // Re-run when DOM changes (Angular renders components later)
  const observer = new MutationObserver(() => init());
  observer.observe(document.body, { childList: true, subtree: true });
}

// Try to initialize after a short delay to allow CDN script to load.
setTimeout(initBootstrapPlugins, 500);

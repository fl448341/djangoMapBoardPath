interface AnimatedListOptions {
    items: string[];
    containerSelector: string;
  }
  
  class AnimatedList {
    private container: HTMLDivElement;
    private list: HTMLDivElement;
    private topGrad: HTMLDivElement;
    private bottomGrad: HTMLDivElement;
    private items: string[];
    private selectedIndex = -1;
    private observer!: IntersectionObserver;
  
    constructor({ items, containerSelector }: AnimatedListOptions) {
      this.items = items;
      this.container = document.querySelector(containerSelector)! as HTMLDivElement;
      this.list = this.container.querySelector('.scroll-list') as HTMLDivElement;
      this.topGrad = this.container.querySelector('.top-gradient') as HTMLDivElement;
      this.bottomGrad = this.container.querySelector('.bottom-gradient') as HTMLDivElement;
  
      this.renderItems();
      this.setupObserver();
      this.bindEvents();
    }
  
    private renderItems() {
      this.list.innerHTML = '';
      this.items.forEach((text, i) => {
        const el = document.createElement('div');
        el.className = 'animated-item';
        el.textContent = text;
        el.dataset.index = String(i);
        el.style.transitionDelay = `${i * 0.05}s`;
        el.addEventListener('click', () => this.select(i));
        el.addEventListener('mouseenter', () => this.select(i));
        this.list.appendChild(el);
      });
    }
  
    private setupObserver() {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
          else e.target.classList.remove('visible');
        });
      }, {
        threshold: 0.5
      });
  
      Array.from(this.list.children).forEach(child => 
        this.observer.observe(child)
      );
    }
  
    private bindEvents() {
      // scroll → gradienty
      this.list.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = this.list;
        this.topGrad.style.opacity = Math.min(scrollTop / 50, 1).toString();
        const bottom = scrollHeight - scrollTop - clientHeight;
        this.bottomGrad.style.opacity = (scrollHeight <= clientHeight ? 0 : Math.min(bottom / 50, 1)).toString();
      });
  
      // klawiatura → nawigacja
      this.list.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.move(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.move(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.selectedIndex >= 0) {
            alert(`Wybrałeś: ${this.items[this.selectedIndex]}`);
          }
        }
      });
  
      // focus, żeby obsłużyć od razu strzałki
      this.list.addEventListener('focus', () => this.list.classList.add('focused'));
      this.list.addEventListener('blur', () => this.list.classList.remove('focused'));
    }
  
    private move(delta: number) {
      const newIdx = Math.max(0, Math.min(this.items.length - 1, this.selectedIndex + delta));
      this.select(newIdx);
    }
  
    private select(idx: number) {
      // odznacz stary
      if (this.selectedIndex >= 0) {
        this.itemAt(this.selectedIndex).classList.remove('selected');
      }
      // zaznacz nowy
      this.selectedIndex = idx;
      const el = this.itemAt(idx);
      el.classList.add('selected');
      // scrollIntoView z marginesem
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  
    private itemAt(idx: number): HTMLDivElement {
      return this.list.querySelector(`[data-index="${idx}"]`)! as HTMLDivElement;
    }
  }
  
  // --- Inicjalizacja ---
  document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from({ length: 25 }, (_, i) => `Item ${i+1}`);
    new AnimatedList({ items, containerSelector: '.scroll-list-container' });
  });
  


  export default AnimatedList;

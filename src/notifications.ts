console.log(' notifications.ts ładuje się');
interface NewBoardData {
    board_id: number;
    board_name: string;
    creator_username: string;
  }
  interface NewPathData {
    path_id: number;
    board_id: number;
    board_name: string;
    user_username: string;
  }
  
  export class NotificationService {
    private source: EventSource;
  
    constructor() {
        console.log(' NotificationService.constructor()');
        this.source = new EventSource('/polls/sse/notifications/');
      
        console.log('EventSource readyState (0=CONNECTING,1=OPEN,2=CLOSED):', this.source.readyState);
      
        this.source.addEventListener('open', () => {
          console.log('SSE: Connections open (addEventListener “open”)');
          console.log('EventSource readyState:', this.source.readyState);
        });
      
        this.source.onopen = () => console.log(' SSE: onopen callback');
      
        this.source.addEventListener('newBoard', (e) => this.handleNewBoard(e as MessageEvent));
        this.source.addEventListener('newPath',  (e) => this.handleNewPath(e as MessageEvent));
        this.source.onerror = (e) => this.handleError(e);
      }
      
  
    private handleNewBoard(e: MessageEvent) {
      const data = JSON.parse(e.data) as NewBoardData;
      this.showToast(
        `User ${data.creator_username} has created a new board: “${data.board_name}”`,
        `/polls/boards/${data.board_id}/`
      );
    }
  
    private handleNewPath(e: MessageEvent) {
      const data = JSON.parse(e.data) as NewPathData;
      this.showToast(
        `User ${data.user_username} has saved path on the board: “${data.board_name}”`,
        `/polls/boards/${data.board_id}/draw/`
      );
    }
  
    private handleError(e: any) {
      console.error('SSE error', e);
      this.showToast('Lost connection with notifications server. Trying again.');
    }
  
    private showToast(message: string, href?: string) {
      const container = document.getElementById('toast-container');
      if (!container) return;
  
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      if (href) {
        toast.addEventListener('click', () => {
          window.location.href = href;
        });
      }
      container.append(toast);
  
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        toast.addEventListener('animationend', () => toast.remove());
      }, 4000);
    }
  }
  

new NotificationService();

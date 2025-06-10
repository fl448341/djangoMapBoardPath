import queue
import threading

clients = set()
clients_lock = threading.Lock()

def register_client(q):
    with clients_lock:
        clients.add(q)

def unregister_client(q):
    with clients_lock:
        clients.discard(q)

def notify_all(message: str):
    """
    Rozsyła przygotowany ciąg SSE do wszystkich zarejestrowanych klientów.
    """
    with clients_lock:
        for q in list(clients):
            q.put(message)

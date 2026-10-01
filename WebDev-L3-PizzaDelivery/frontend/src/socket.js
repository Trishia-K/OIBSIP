import { io } from 'socket.io-client';
import { API_URL } from './api';

export function connectSocket() {
  return io(API_URL, { auth: { token: localStorage.getItem('token') } });
}

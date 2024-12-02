import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'http://localhost:3000/api'; // URL

interface DecodedToken {
  id: string;
  email: string;
}

// Lấy token từ cookie
const getTokenFromCookies = (): string | null => {
  if (typeof document !== 'undefined') {
    const token = document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1];
    return token || null;
  }
  return null;
};

// Đăng ký
export const signup = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/signup`, { email, password });
  return response.data;
};

// Đăng nhập
export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/login`, { email, password }, { withCredentials: true });
  return response.data;
};

// Đăng xuất
export const logout = async () => {
  const response = await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
  return response.data;
};

// Lấy toàn bộ group hiện có
export const getAllGroups = async () => { 
  const response = await axios.get(`${API_BASE_URL}/group/getAllGroup`, { withCredentials: true }); 
  return response.data; 
};

// Lấy 1 group theo id group
export const getGroupById = async (groupId: string) => {
  const response = await axios.get(`${API_BASE_URL}/group/${groupId}`, {
    withCredentials: true
  });
  return response.data;
};

// Lấy toàn bộ note từ 1 group
export const getAllGroupNotes = async (groupId: string) => {
  const response = await axios.get(`${API_BASE_URL}/note/getAllGroupNote`, {
    params: { group_id: groupId },
    withCredentials: true
  });
  return response.data;
};

// Lấy toàn bộ lời mời
export const getAllInvited = async () => {
  const response = await axios.get(`${API_BASE_URL}/allInvited`, { withCredentials: true });
  return response.data;
};

// Phản hồi lời mời
export const respondToInvite = async (inviteId: string, state: string) => {
  const response = await axios.post(`${API_BASE_URL}/group/response`, { inviteId, state }, { withCredentials: true });
  return response.data;
};

// Chỉnh sửa thông tin note
export const editNote = async (groupId: string, content: string, lastModifiedBy: string, noteId: string) => {
  const response = await axios.post(`${API_BASE_URL}/note/edit`, { groupId, content, lastModifiedBy, noteId }, {
    withCredentials: true
  });
  return response.data;
};

// Lấy email của user
export const getCurrentUserEmail = (): string | null => {
  const token = getTokenFromCookies();
  if (token) {
    const decodedToken = jwtDecode<DecodedToken>(token);
    return decodedToken.email;
  }
  return null;
};

// Lấy id của user
export const getCurrentUserId = (): string | null => {
  const token = getTokenFromCookies();
  if (token) {
    const decodedToken = jwtDecode<DecodedToken>(token);
    return decodedToken.id;
  }
  return null;
};
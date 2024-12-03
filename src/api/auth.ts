import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// const API_BASE_URL = 'https://26.216.17.44:3000/api';

const API_BASE_URL = 'http://localhost:3000/api';

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


// Authentication
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
  // confirm
  const response = await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
  return response.data;
};


// Group
// Lấy toàn bộ group hiện có
export const getAllGroups = async () => { 
  const response = await axios.get(`${API_BASE_URL}/group`, { withCredentials: true }); 
  return response.data; 
};

// Lấy 1 group theo id group
export const getGroupById = async (groupId: string) => {
  const response = await axios.get(`${API_BASE_URL}/group/${groupId}`, {
    withCredentials: true
  });
  return response.data;
};
// Thêm group mới
export const addGroup = async (groupName: string, members: { _id: string, email: string, role: string }[]) => {
  const response = await axios.post(`${API_BASE_URL}/group`, {
    group_name: groupName,
    members
  }, { withCredentials: true });
  return response.data;
};



// Invite
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
// Gửi lời mời user
export const inviteUser = async (groupId: string, invitingUser: string, invitedUser: string) => {
  const response = await axios.post(`${API_BASE_URL}/group/invite`, {
    group_id: groupId,
    inviting_user_id: invitingUser,
    invited_user_id: invitedUser
  }, { withCredentials: true });
  return response.data;
};


// Note
// Lấy toàn bộ note từ 1 group
export const getAllGroupNotes = async (group_id: string) => {
  const response = await axios.post(`${API_BASE_URL}/note/getAllGroupNote`, 
    { group_id},{ withCredentials: true }
  );
  return response.data;
};

// Chỉnh sửa thông tin note
export const editNote = async (groupId: string, content: string, lastModifiedBy: string, noteId: string) => {
  const response = await axios.post(`${API_BASE_URL}/note/edit`, { groupId, content, lastModifiedBy, noteId }, {
    withCredentials: true
  });
  return response.data;
};

// Thêm note
export const addNote = async (groupId: string, content: string, lastModifiedBy: string) => {
  const response = await axios.post(`${API_BASE_URL}/note`, {
    group_id: groupId,
    content,
    last_modified_by: lastModifiedBy
  }, { withCredentials: true });
  return response.data;
};
// Xóa note
export const deleteNote = async (noteId: string) => {
  const response = await axios.post(`${API_BASE_URL}/note/delete`, {
    note_id: noteId
  }, { withCredentials: true });
  return response.data;
};


// User
// getUserIdByEmail
export const getUserIdEmail = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/findUser`, { email }, {
    withCredentials: true
  });
  return response.data;
};

// Lấy email của user
export const getCurrentUserEmail = (): string | null => {
  const email = localStorage.getItem('email');
  return email;
};

// Lấy id của user
export const getCurrentUserId = (): string | null => {
  const id = localStorage.getItem('id');
  return id;
};
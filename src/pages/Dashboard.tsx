import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Button } from 'antd';
import 'antd/dist/reset.css';
import Groups from '../components/Groups/Groups';
import { getCurrentUserEmail, logout, getAllInvited, respondToInvite, getCurrentUserId } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Invited
interface Invitation { 
  _id: string; 
  group_id: string; 
  inviting_user_id: string; 
  invited_user_id: string; 
  state: string; 
  invite_time: string; 
  group_details: { 
    _id: string; 
    group_name: string; 
  }; 
  user_invite: { 
    _id: string; 
    email: string; 
  };
};

const Dashboard: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const navigate = useNavigate();

  useEffect(() => { 
    const email = getCurrentUserEmail(); 
    setEmail(email);

    // fetch invited
    const getInvited = async () => {
      try {
        const userId = getCurrentUserId();
        const data = await getAllInvited();
        if (data) {
          const filterInvite = data.filter((invitation: Invitation) => invitation.invited_user_id === userId);
          setInvitations(filterInvite);
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }
    };

    getInvited();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAccept = async (inviteId: string) => {
    try {
      await respondToInvite(inviteId, 'accepted');
      alert('Respond success!');
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDecline = async (inviteId: string) => {
    try {
      await respondToInvite(inviteId, 'decline');
      alert('Respond success!');
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  return (
    <div className="bg-gray-100 h-screen grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] p-10 gap-5">
      {/* Logout */}
      <div className='flex flex-col'>
        <div className='bg-white py-5 border border-gray-300 shadow-lg flex flex-col items-center rounded-lg h-min'>
          <Title level={2}>Welcome!</Title>
          <p className="text-xl">{email}</p>
        </div>
        <Button type="default" onClick={handleLogout} className="w-min my-4">
          Logout
        </Button>
      </div>

      {/* Group and note */}
      <Groups />

      {/* Invited */}
      <div className='bg-white py-5 border border-gray-300 shadow-lg flex flex-col items-center rounded-lg h-min'>
        <Title level={2}>Invite received</Title>
        <List 
          grid={{ gutter: 16, column: 1 }} 
          dataSource={invitations} 
          renderItem={invitation => ( 
            <List.Item key={invitation._id}> 
              <Card> 
                <p>Invited to: {invitation.group_details.group_name}</p>
                <p>Invited by: {invitation.user_invite.email}</p>
                <p>Invite at: {new Date(invitation.invite_time).toLocaleString()}</p> 
                <Button type="primary" onClick={() => handleAccept(invitation._id)} disabled={invitation.state !== 'none'}>
                  Accept
                </Button>
                <Button type="default" onClick={() => handleDecline(invitation._id)} disabled={invitation.state !== 'none'}>
                  Decline
                </Button>
              </Card>
            </List.Item> 
          )} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState } from 'react';
import { Typography, Collapse, List, Button, Tag, Modal, Input } from 'antd';
import { getGroupById, getAllGroupNotes, getCurrentUserId, getCurrentUserEmail, getAllGroups, getUserIdEmail, editNote, addNote, deleteNote, inviteUser, addGroup } from '../../api/auth';
import 'antd/dist/reset.css';
import io from "socket.io-client";
import { all } from 'axios';
import { message } from 'antd';

const { Title } = Typography;
const { confirm } = Modal;

interface Member { 
  _id: string; 
  email: string; 
  role: string; 
}

interface Group {
  _id: string;
  group_name: string;
  members: Member[];
}

interface Note {
  _id: string;
  group_id: string;
  content: string;
  last_modified_by: string;
}
// Hàng đợi
interface Queue {
  userEmail: string;

}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editQueue, setEditQueue] = useState<Queue[]>([]);
  const [currentNote, setCurrentNote] = useState<{ note: Note | null; isEditing: boolean }>({ note: null, isEditing: false });
  const [editContent, setEditContent] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string | string[]>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [editRequest, setEditRequest] = useState<Queue | null>(null);
  const [addNoteVisible, setAddNoteVisible] = useState<boolean>(false);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [addGroupVisible, setAddGroupVisible] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [inviteVisible, setInviteVisible] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [selectedInviteGroupId, setSelectedInviteGroupId] = useState<string>('');


  useEffect(() => {
    // fetch group, note
    const fetchUserGroupsAndNotes = async () => {
      try { 
        const allGroups = await getAllGroups(); 
        const userGroups: Group[] = []; 
        let allNotes: Note[] = [];

        for (const group of allGroups) {
            const groupData = await getGroupById(group._id); 
            groupData[0].role = group.role;
            userGroups.push(groupData[0]);
            allNotes = await getAllGroupNotes(group._id); 
          }
        setNotes(allNotes);
        setGroups(userGroups);
      } catch (error) { 
        console.error('Error fetching group or notes:', error); 
      } 
    }; 
    fetchUserGroupsAndNotes(); 
  }, []);   

  useEffect(() => { 
    if (editRequest) { 
      // nhận edit request -> thêm vào queue
      setEditQueue(prevQueue => [...prevQueue, editRequest]); 
    } 
  }, [editRequest]);

  useEffect(() => { 
    if (editQueue.length > 0) { 
      console.log(editQueue.length)
    } 
  }, [editQueue, notes]);

  const viewNote = (note: Note) => {
    setCurrentNote({ note, isEditing: false });
    setEditContent(note.content);
  };

  const handleEditClick = (note: Note | null) => { 
    if (!note) return;
    // const socket= io("https://26.216.17.44:3000", {withCredentials:true});
    const userEmail = getCurrentUserEmail();
    if (userEmail) { 
      // gửi edit request
      setEditRequest({ userEmail });
    }  
    // note vào trạng thái chờ (pending)
    setLoading(true);
  };  

  const saveNote = async () => {
    if (currentNote.note) {
      // const { group_id, _id } = currentNote.note; 
      const content = editContent;
      const currentUserId = getCurrentUserId();
      try {
        // API post thông tin note
        // await editNote(group_id, content, currentUserId || 'unknown', _id);

        setCurrentNote({ note: null, isEditing: false });
        setEditContent('');
      } catch (error) { 
        console.error('Error saving note:', error); 
      }
    }
  };  

  const showUnsavedChangesConfirm = () => {
    confirm({
      title: 'Unsaved Changes',
      content: 'Dữ liệu chưa được lưu. Bạn có chắc chắn muốn đóng mà không lưu không?',
      onOk() {
        setCurrentNote({ note: null, isEditing: false });
        setEditContent('');
      }
    });
  };
  
  const handleCancel = () => {
    if (currentNote.isEditing) {
      showUnsavedChangesConfirm();
    } else {
      setCurrentNote({ note: null, isEditing: false });
      setEditContent('');
      // Bỏ khỏi hàng đợi
      // setEditQueue(prevQueue => prevQueue.filter(queueItem => queueItem.noteId !== currentNote.note!._id));
    }
  };  

  const handleAddNoteClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setAddNoteVisible(true);
  };

  const handleAddNote = async () => {
    const content = newNoteContent.trim();
    const last_modified_by = getCurrentUserId();
    const group_id = selectedGroupId;
  
    if (!content) {
      message.error('Note content cannot be empty!');
      return;
    }
  
    try {
      const newNote = await addNote(group_id, content, last_modified_by || 'unknown');
  
      // Add the new note to state
      setNotes((prevNotes) => [...prevNotes, newNote]);
  
      setNewNoteContent('');
      setAddNoteVisible(false);
      message.success('Note added successfully!');
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note');
    }
  };
  
  const handleDeleteNote = async (noteId: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this note? This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'No, keep it',
      onOk: async () => {
        try {
          const response = await deleteNote(noteId);
  
          // Remove the note from state
          setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
          
          setCurrentNote({ note: null, isEditing: false });
          setEditContent('');
  
          // Show success message
          message.success('Note deleted successfully!');
        } catch (error) {
          console.error('Error deleting note:', error);
          message.error('Failed to delete note');
        }
      }
    });
  };  

  const handleAddGroup = async () => {
    const groupName = newGroupName.trim(); // Trim to remove any leading/trailing spaces
    const currentUserId = getCurrentUserId();
    const currentUserEmail = getCurrentUserEmail();
  
    if (!groupName) {
      message.error('Group name cannot be empty!');
      return;
    }
  
    try {
      const newGroup = await addGroup(groupName, [{ _id: currentUserId, email: currentUserEmail, role: 'admin' }]);
  
      // Add the new group to state
      setGroups((prevGroups) => [...prevGroups, newGroup]);
  
      setNewGroupName('');
      setAddGroupVisible(false);
      message.success('Group added successfully!');
    } catch (error) {
      console.error('Error adding group:', error);
      message.error('Failed to add group');
    }
  };  

  const handleInviteClick = (groupId: string) => {
    setSelectedInviteGroupId(groupId);
    setInviteVisible(true);
  };

  const handleInviteUser = async () => {
    const email = inviteEmail.trim();
    const group_id = selectedInviteGroupId;
  
    if (!email) {
      message.error('Email cannot be empty!');
      return;
    }
  
    try {
      const invited_user = await getUserIdEmail(email);
      const inviting_user_id = getCurrentUserId();
      if (invited_user && inviting_user_id) {
        const response = await inviteUser(group_id, inviting_user_id, invited_user._id);
    
        setInviteEmail('');
        setInviteVisible(false);
        message.success('User invited successfully!');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      message.error('Failed to invite user');
    }
  };
  

  const collapseItems = groups.map(group => ({
    key: group._id,
    label: group.group_name,
    children: (
      <div>
        <Button 
              key="invite" 
              type="default" 
              onClick={() => handleInviteClick(group._id)}
            > 
              Invite 
            </Button>
        <Title level={5} className="mt-4">Notes</Title>
        <List
          dataSource={notes.filter(note => note.group_id === group._id)}
          renderItem={(note: Note) => (
            <List.Item
              key={note._id}
              actions={[
                <Button onClick={() => viewNote(note)}>View</Button>
              ]}
            >
              <List.Item.Meta
                title={`Note ID: ${note._id}`}
              />
            </List.Item>
          )}
        />
        <Button 
              key="add" 
              type="default" 
              onClick={() => handleAddNoteClick(group._id)}
            > 
              Add Note 
            </Button>
      </div>
    )
  }));

  return (
    <div>
      <div className="bg-white flex flex-col items-center p-5 border border-gray-300 shadow-lg rounded-lg">
        <Title level={2} className="mb-4">Your Groups</Title>
        <Collapse
          className="w-full max-w-lg"
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={collapseItems}
        />

        <Modal
          title={`View Note ID: ${currentNote.note?._id}`}
          open={!!currentNote.note}
          onCancel={handleCancel}
          footer={[
            <Button 
              key="save" 
              type="primary" 
              onClick={saveNote} 
              hidden={!currentNote.isEditing}
            > 
              Save 
            </Button>,
            <Button 
              key="edit" 
              type="primary" 
              onClick={() => handleEditClick(currentNote.note)} 
              loading={loading} 
              disabled={currentNote.isEditing} 
            >
              Edit 
            </Button>,
            <Button key="cancel" onClick={handleCancel}>Cancel</Button>
          ]}
          maskClosable={false}
        >
          <Input.TextArea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={!currentNote.isEditing}
            style={{ backgroundColor: '#fff', color: 'black' }} 
          />
          {/* <p>Last modified by {currentNote.note?.user_details.email}</p> */}
          
          <p>Last modified by {currentNote.note?.last_modified_by}</p>
          {/*  */}
          <div> 
            <Button 
              key="delete" 
              type="primary" 
              danger
              onClick={() => handleDeleteNote(currentNote.note!._id)}
            >
              Delete Note
            </Button>
          {/* <Title level={5}>Queue</Title> 
          <List 
            dataSource={editQueue} 
            renderItem={(queueItem, index) => ( 
              <List.Item key={queueItem.noteId + index}> 
                <List.Item.Meta 
                  title={`Note ID: ${queueItem.noteId}, Email: ${queueItem.userEmail}`} 
                  description={`Position in queue: ${index + 1}`} 
                /> 
              </List.Item> 
            )} 
          />  */}
        </div>
        </Modal>
        <Modal
          title="Add Note"
          open={addNoteVisible}
          onCancel={() => setAddNoteVisible(false)}
          onOk={handleAddNote}
          maskClosable={false}
        >
          <Input.TextArea 
            value={newNoteContent} 
            onChange={(e) => setNewNoteContent(e.target.value)} 
            placeholder="Enter note content"
          />
        </Modal>
        <br/>
        <Button 
          key="add-group" 
          type="default" 
          onClick={() => setAddGroupVisible(true)}
        > 
          Add Group 
        </Button>
        <Modal
          title="Add Group"
          open={addGroupVisible}
          onCancel={() => setAddGroupVisible(false)}
          onOk={handleAddGroup}
          maskClosable={false}
        >
          <Input 
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.target.value)} 
            placeholder="Enter group name"
          />
        </Modal>
        <Modal
          title="Invite User"
          open={inviteVisible}
          onCancel={() => setInviteVisible(false)}
          onOk={handleInviteUser}
          maskClosable={false}
        >
          <Input 
            value={inviteEmail} 
            onChange={(e) => setInviteEmail(e.target.value)} 
            placeholder="Enter user email"
          />
        </Modal>

    </div>
    </div>
  );
};

export default Groups;
import React, { useEffect, useState } from 'react';
import { Typography, Collapse, List, Button, Tag, Modal, Input, Spin } from 'antd';
import { getGroupById, getAllGroupNotes, getCurrentUserId, getCurrentUserEmail, getAllGroups } from '../../api/auth';
import 'antd/dist/reset.css';

const { Title } = Typography;

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
  // Trạng thái của note
  status: 'available' | 'pending' | 'locked';
}
// Hàng đợi
interface Queue {
  noteId: string;
  userEmail: string;
}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editQueue, setEditQueue] = useState<Queue[]>([]);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [historyNote, setHistoryNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string | string[]>('');
  const [loading, setLoading] = useState<string | null>(null);
  const [editRequest, setEditRequest] = useState<Queue | null>(null);
  
  useEffect(() => {
    // fetch group, note
    const fetchUserGroupsAndNotes = async () => {
      try {  
        const userId = getCurrentUserId();
        const allGroups = await getAllGroups(); 
        const userGroups: Group[] = []; 
        const allNotes: Note[] = [];

        for (const group of allGroups) {
          if (group.members.some((member: Member) => member._id === userId)) {
            const groupData = await getGroupById(group._id); 
            userGroups.push(groupData[0]); 
            const notesData = await getAllGroupNotes(group._id); 
            // Thêm status, mặc định available
            const notesWithStatus = notesData.map((note: Note) => ({ 
              ...note, 
              status: note.status || 'available' 
            }));
            allNotes.push(...notesWithStatus); 
          } 
        }
        setGroups(userGroups); 
        setNotes(allNotes);
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
      const { noteId } = editQueue[0]; 
      // chờ 1 giây
      setTimeout(() => { 
        if (editQueue[0]?.noteId === noteId) { 
          // nếu đứng đầu queue -> cho edit, note vào trạng thái locked
          setEditingNote(notes.find(n => n._id === noteId) || null); 
          setNotes(prevNotes => 
            prevNotes.map(n => n._id === noteId ? { ...n, status: 'locked' } : n)
          ); 
          // ngừng load, bỏ khỏi hàng đợi
          setLoading(null); 
          setEditQueue(prevQueue => prevQueue.slice(1));
        } else { 
          // Nếu không edit được, reset thạng thái về available
          setNotes(prevNotes => 
            prevNotes.map(n => n._id === noteId ? { ...n, status: 'available' } : n) 
          ); 
          // ngừng load, bỏ khỏi hàng đợi
          setLoading(null); 
          setEditQueue(prevQueue => prevQueue.filter(queueItem => queueItem.noteId !== noteId));
        } 
      }, 1000); 
    } 
  }, [editQueue, notes]);

  const viewNote = (note: Note) => {
    setViewingNote(note);
  };

  const handleEditClick = (note: Note) => {
    const userEmail = getCurrentUserEmail();
    if (userEmail) { 
      // gửi edit request
      setEditRequest({ noteId: note._id, userEmail });
    }  
    // note vào trạng thái chờ (pending)
    setLoading(note._id);
    setNotes(prevNotes => 
      prevNotes.map(n => n._id === note._id ? { ...n, status: 'pending' } : n) 
    );
  };  

  const saveNote = () => {
    if (editingNote) {
      const currentUserId = getCurrentUserId();
      // Lưu id user edit cuối, chuyển trạng thái available
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === editingNote._id
            ? { 
                ...note, 
                content: editContent, 
                last_modified_by: currentUserId ? currentUserId : 'unknown',
                status: 'available'
              }
            : note
        )
      );
      setEditingNote(null);
      setEditContent('');
      // Bỏ khỏi hàng đợi
      setEditQueue(prevQueue => prevQueue.filter(queueItem => queueItem.noteId !== editingNote._id));
    }
  };  

  const cancelEdit = () => {
    if (editingNote) {
      // Hủy edit, chuyển trạng thái available 
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === editingNote._id
            ? { ...note, status: 'available' }
            : note
        )
      );
      setEditingNote(null);
      setEditContent('');
      // Bỏ khỏi hàng đợi
      setEditQueue(prevQueue => prevQueue.filter(queueItem => queueItem.noteId !== editingNote._id));
    }
  };     

  const viewHistory = (note: Note) => {
    setHistoryNote(note);
  };

  const getStatusTag = (note: Note) => {
    if (note.status === 'locked') {
      return <Tag color="red">Locked</Tag>;
    } else if (note.status === 'pending') {
      return <Tag color="orange">Pending</Tag>;
    }
    return <Tag color="green">Available</Tag>;
  };  

  const collapseItems = groups.map(group => ({
    key: group._id,
    label: group.group_name,
    children: (
      <div>
        <Title level={5} className="mt-4">Notes</Title>
        <List
          dataSource={notes.filter(note => note.group_id === group._id)}
          renderItem={(note: Note) => (
            <List.Item
              key={note._id}
              actions={[
                <Button onClick={() => viewNote(note)}>View</Button>,
                <Button
                  onClick={() => handleEditClick(note)}
                  loading={loading === note._id}
                  disabled={loading === note._id || note.status === 'locked'}
                >
                  {loading === note._id ? <Spin /> : 'Edit'}
                </Button>,
                <Button onClick={() => viewHistory(note)}>History</Button>
              ]}
            >
              <List.Item.Meta
                title={`Note ID: ${note._id}`}
                description={getStatusTag(note)}
              />
            </List.Item>
          )}
        />
        <div> 
          <Title level={5}>Queue</Title> 
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
          /> 
        </div>
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
          title={`View Note ID: ${viewingNote?._id}`}
          open={!!viewingNote}
          onCancel={() => setViewingNote(null)}
          footer={<Button onClick={() => setViewingNote(null)}>Close</Button>}
        >
          <p>{viewingNote?.content}</p>
        </Modal>

        <Modal
          title={`Edit Note ID: ${editingNote?._id}`}
          open={!!editingNote}
          onCancel={cancelEdit}
          footer={[
            <Button key="cancel" onClick={cancelEdit}>Cancel</Button>,
            <Button key="save" type="primary" onClick={saveNote}>Save</Button>
          ]}
        >
          <Input.TextArea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </Modal>

        <Modal
          title={`History of Note ID: ${historyNote?._id}`}
          open={!!historyNote}
          onCancel={() => setHistoryNote(null)}
          footer={<Button onClick={() => setHistoryNote(null)}>Close</Button>}
        >
          <p>Last modified by user with ID {historyNote?.last_modified_by}</p>
        </Modal>
      </div>
    </div>
  );
};

export default Groups;
import React, { useEffect, useState } from 'react';
import { Typography, Collapse, List, Button, Tag, Modal, Input } from 'antd';
import { getGroupById, getAllGroupNotes, getCurrentUserId, getCurrentUserEmail, getAllGroups, editNote } from '../../api/auth';
import 'antd/dist/reset.css';

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
  const [currentNote, setCurrentNote] = useState<{ note: Note | null; isEditing: boolean }>({ note: null, isEditing: false });
  const [editContent, setEditContent] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string | string[]>('');
  const [loading, setLoading] = useState<boolean>(false);
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
          setCurrentNote({ note: notes.find(n => n._id === noteId) || null, isEditing: true });
          setNotes(prevNotes => 
            prevNotes.map(n => n._id === noteId ? { ...n, status: 'locked' } : n)
          ); 
          // ngừng load, bỏ khỏi hàng đợi
          setLoading(false); 
          setEditQueue(prevQueue => prevQueue.slice(1));
        } else { 
          // Nếu không edit được, reset thạng thái về available
          setNotes(prevNotes => 
            prevNotes.map(n => n._id === noteId ? { ...n, status: 'available' } : n) 
          ); 
          // ngừng load, bỏ khỏi hàng đợi
          setLoading(false); 
          setEditQueue(prevQueue => prevQueue.filter(queueItem => queueItem.noteId !== noteId));
        } 
      }, 1000); 
    } 
  }, [editQueue, notes]);

  const viewNote = (note: Note) => {
    setCurrentNote({ note, isEditing: false });
    setEditContent(note.content);
  };

  const handleEditClick = (note: Note | null) => { 
    if (!note) return;

    const userEmail = getCurrentUserEmail();
    if (userEmail) { 
      // gửi edit request
      setEditRequest({ noteId: note._id, userEmail });
    }  
    // note vào trạng thái chờ (pending)
    setLoading(true);
    setNotes(prevNotes => 
      prevNotes.map(n => n._id === note._id ? { ...n, status: 'pending' } : n) 
    );
  };  

  const saveNote = async () => {
    if (currentNote.note) {
      // const { group_id, _id } = currentNote.note; 
      const content = editContent;
      const currentUserId = getCurrentUserId();
      try {
        // API post thông tin note
        // await editNote(group_id, content, currentUserId || 'unknown', _id);

        // Lưu id user edit cuối, chuyển trạng thái available
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === currentNote.note!._id
              ? { 
                  ...note, 
                  content, 
                  last_modified_by: currentUserId ? currentUserId : 'unknown',
                  status: 'available'
                }
              : note
          )
        );
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
        // Hủy edit, chuyển trạng thái available 
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === currentNote.note!._id
              ? { ...note, status: 'available' }
              : note
          )
        );
        setCurrentNote({ note: null, isEditing: false });
        setEditContent('');
      }
    });
  };
  
  const handleCancel = () => {
    if (currentNote.isEditing) {
      showUnsavedChangesConfirm();
    } else {
      // Hủy edit, chuyển trạng thái available 
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === currentNote.note!._id
            ? { ...note, status: 'available' }
            : note
        )
      );
      setCurrentNote({ note: null, isEditing: false });
      setEditContent('');
      // Bỏ khỏi hàng đợi
      setEditQueue(prevQueue => prevQueue.filter(queueItem => queueItem.noteId !== currentNote.note!._id));
    }
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
                <Button onClick={() => viewNote(note)}>View</Button>
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
          title={`View Note ID: ${currentNote.note?._id}`}
          open={!!currentNote.note}
          onCancel={handleCancel}
          footer={[
            <Button 
              key="save" 
              type="primary" 
              onClick={saveNote} 
              disabled={!currentNote.isEditing} 
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
          <p>Last modified by user with ID {currentNote.note?.last_modified_by}</p>
        </Modal>
      </div>
    </div>
  );
};

export default Groups;
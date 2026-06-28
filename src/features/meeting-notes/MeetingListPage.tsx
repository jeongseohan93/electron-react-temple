import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meeting } from '../../types/electron';
import { FiPlus } from 'react-icons/fi';
import MeetingCard from './components/MeetingCard';
import CreateMeetingModal from './components/CreateMeetingModal';
import style from './style/MeetingNotes.module.css';

const MeetingListPage = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMeetings = async () => {
    const res = await window.lostarkAPI.meetingList();
    if (res.success && res.data) setMeetings(res.data);
  };

  useEffect(() => { loadMeetings(); }, []);

  const handleCreate = async (title: string, participants: string[]) => {
    setShowModal(false);
    const res = await window.lostarkAPI.meetingCreate({ title, participants });
    if (res.success && res.data) {
      navigate(`/meeting/${res.data.id}`);
    } else {
      showToast(res.message ?? '생성 실패', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('이 회의록을 삭제하시겠습니까?')) return;
    const res = await window.lostarkAPI.meetingDelete(id);
    if (res.success) {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      showToast('삭제되었습니다.');
    } else {
      showToast(res.message ?? '삭제 실패', 'error');
    }
  };

  return (
    <div className={style.page}>
      <div className={style.pageHeader}>
        <h1 className={style.pageTitle}>회의록</h1>
        <button className={style.btnPrimary} onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> 새 회의록
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className={style.emptyState}>
          <p>아직 회의록이 없습니다.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            「새 회의록」을 클릭해 시작하세요.
          </p>
        </div>
      ) : (
        <div className={style.cardGrid}>
          {meetings.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onClick={() => navigate(`/meeting/${m.id}`)}
              onDelete={(e) => handleDelete(e, m.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CreateMeetingModal
          onConfirm={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && (
        <div className={`${style.toast} ${toast.type === 'error' ? style.toastError : style.toastSuccess}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default MeetingListPage;

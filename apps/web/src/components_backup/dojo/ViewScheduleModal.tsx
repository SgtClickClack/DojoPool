import React, { useEffect, useState } from 'react';
import ScheduleService, { ScheduleEvent } from '../../services/ScheduleService';
import { CurrentUserService } from '../../services/CurrentUserService';
import styles from './ViewScheduleModal.module.css';

interface ViewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  dojoId: string;
  dojoName: string;
}

const ViewScheduleModal: React.FC<ViewScheduleModalProps> = ({
  isOpen,
  onClose,
  dojoId,
  dojoName,
}) => {
  const [activeTab, setActiveTab] = useState<
    'upcoming' | 'ongoing' | 'completed'
  >('upcoming');
  const [scheduleData, setScheduleData] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Real-time schedule data from ScheduleService
  useEffect(() => {
    if (isOpen) {
      setLoading(true);

      const scheduleService = ScheduleService.getInstance();

      // Fetch initial schedule data
      const fetchSchedule = async () => {
        try {
          const events = await scheduleService.getVenueSchedule(dojoId);
          setScheduleData(events);
        } catch (error) {
          console.error('Error fetching schedule:', error);
          setScheduleData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchSchedule();

      // Subscribe to real-time updates
      const unsubscribe = scheduleService.subscribeToVenueSchedule(
        dojoId,
        (events) => {
          setScheduleData(events);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, dojoId]);

  const filteredEvents = scheduleData.filter(
    (event) => event.status === activeTab
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#4ecdc4';
      case 'ongoing':
        return '#ff6b6b';
      case 'completed':
        return '#95a5a6';
      default:
        return '#b3b3b3';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return '🏆';
      case 'match':
        return '🎱';
      case 'event':
        return '📚';
      default:
        return '📅';
    }
  };

  const handleRegisterForTournament = async (tournamentId: string) => {
    try {
      const user = CurrentUserService.getCurrentUser();
      const scheduleService = ScheduleService.getInstance();
      const success = await scheduleService.registerForTournament(
        tournamentId,
        user.id
      );

      if (success) {
        alert('Successfully registered for tournament!');
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
      alert('Failed to register for tournament. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>📅 {dojoName} Schedule</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'upcoming' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming (
            {scheduleData.filter((e) => e.status === 'upcoming').length})
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'ongoing' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('ongoing')}
          >
            Ongoing ({scheduleData.filter((e) => e.status === 'ongoing').length}
            )
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'completed' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed (
            {scheduleData.filter((e) => e.status === 'completed').length})
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading schedule...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3>No {activeTab} events</h3>
              <p>Check back later for new events and tournaments!</p>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {filteredEvents.map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <div className={styles.eventIcon}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className={styles.eventInfo}>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      <p className={styles.eventDescription}>
                        {event.description}
                      </p>
                    </div>
                    <div className={styles.eventStatus}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: getStatusColor(event.status),
                        }}
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.eventDetails}>
                    <div className={styles.timeInfo}>
                      <div className={styles.timeItem}>
                        <span className={styles.timeLabel}>Start:</span>
                        <span className={styles.timeValue}>
                          {formatTime(event.startTime)} •{' '}
                          {formatDate(event.startTime)}
                        </span>
                      </div>
                      <div className={styles.timeItem}>
                        <span className={styles.timeLabel}>End:</span>
                        <span className={styles.timeValue}>
                          {formatTime(event.endTime)} •{' '}
                          {formatDate(event.endTime)}
                        </span>
                      </div>
                    </div>

                    {event.participants !== undefined && (
                      <div className={styles.participantInfo}>
                        <span className={styles.participantCount}>
                          {event.participants}/{event.maxParticipants}{' '}
                          participants
                        </span>
                        {event.participants < (event.maxParticipants || 0) && (
                          <span className={styles.spotsAvailable}>
                            {event.maxParticipants! - event.participants} spots
                            available
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.eventActions}>
                    {event.status === 'upcoming' &&
                      event.type === 'tournament' && (
                        <button
                          className={styles.actionButton}
                          onClick={() =>
                            handleRegisterForTournament(event.tournamentId!)
                          }
                        >
                          Register Now
                        </button>
                      )}
                    {event.status === 'ongoing' && (
                      <button className={styles.actionButton}>
                        Watch Live
                      </button>
                    )}
                    <button className={styles.secondaryButton}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.footerButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewScheduleModal;

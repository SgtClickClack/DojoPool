import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Tabs, Descriptions, Tag, message } from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  TeamOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import { getVenue } from "../../api/venues";
import CheckInSystem from "./CheckInSystem";
import LeaderboardList from "./LeaderboardList";
import EventList from "../events/EventList";
import LoadingSpinner from "../common/LoadingSpinner";

const { TabPane } = Tabs;

const VenueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenue();
  }, [id]);

  const fetchVenue = async () => {
    try {
      setLoading(true);
      const data = await getVenue(parseInt(id));
      setVenue(data);
    } catch (error) {
      console.error("Error fetching venue:", error);
      message.error("Failed to fetch venue details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!venue) {
    return <div>Venue not found</div>;
  }

  return (
    <div className="venue-detail">
      <Card>
        <div className="venue-detail__header">
          <h1>{venue.name}</h1>
          <Tag color={venue.is_active ? "success" : "default"}>
            {venue.is_active ? "Open" : "Closed"}
          </Tag>
        </div>

        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item
            label={
              <>
                <EnvironmentOutlined /> Address
              </>
            }
          >
            {venue.address}, {venue.city}, {venue.state} {venue.postal_code}
          </Descriptions.Item>
          {venue.phone && (
            <Descriptions.Item
              label={
                <>
                  <PhoneOutlined /> Phone
                </>
              }
            >
              {venue.phone}
            </Descriptions.Item>
          )}
          {venue.email && (
            <Descriptions.Item
              label={
                <>
                  <MailOutlined /> Email
                </>
              }
            >
              {venue.email}
            </Descriptions.Item>
          )}
          {venue.website && (
            <Descriptions.Item
              label={
                <>
                  <GlobalOutlined /> Website
                </>
              }
            >
              <a href={venue.website} target="_blank" rel="noopener noreferrer">
                {venue.website}
              </a>
            </Descriptions.Item>
          )}
        </Descriptions>

        {venue.description && (
          <div className="venue-detail__description">
            <p>{venue.description}</p>
          </div>
        )}

        <Tabs defaultActiveKey="checkin">
          <TabPane
            tab={
              <span>
                <TeamOutlined /> Check-in
              </span>
            }
            key="checkin"
          >
            <CheckInSystem venueId={parseInt(id)} venueName={venue.name} />
          </TabPane>
          <TabPane
            tab={
              <span>
                <TrophyOutlined /> Leaderboard
              </span>
            }
            key="leaderboard"
          >
            <LeaderboardList venueId={parseInt(id)} />
          </TabPane>
          <TabPane
            tab={
              <span>
                <CalendarOutlined /> Events
              </span>
            }
            key="events"
          >
            <EventList venueId={parseInt(id)} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default VenueDetail;

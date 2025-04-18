import React, { useState, useEffect } from "react";
import { Card, Table, Button, Tag, Modal, message, Tabs } from "antd";
import {
  TrophyOutlined,
  DollarOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import moment from "moment";

import { useAuth } from "../../hooks/useAuth";
import {
  getUnclaimedPrizes,
  getPrizeHistory,
  claimPrize,
} from "../../api/tournaments";

const { TabPane } = Tabs;

interface Prize {
  tournament_id: number;
  tournament_name: string;
  amount: number;
  rank: number;
  date: string;
  claimed: boolean;
  claimed_at?: string;
  participant_id: number;
}

const PrizeManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unclaimedPrizes, setUnclaimedPrizes] = useState<Prize[]>([]);
  const [prizeHistory, setPrizeHistory] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [claimModalVisible, setClaimModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrizes();
    }
  }, [user]);

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const [unclaimed, history] = await Promise.all([
        getUnclaimedPrizes(user!.id),
        getPrizeHistory(user!.id),
      ]);
      setUnclaimedPrizes(unclaimed);
      setPrizeHistory(history);
    } catch (error) {
      console.error("Error fetching prizes:", error);
      message.error("Failed to fetch prizes");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPrize = async () => {
    if (!selectedPrize) return;

    try {
      await claimPrize(
        selectedPrize.participant_id,
        selectedPrize.tournament_id,
      );
      message.success("Prize claimed successfully");
      setClaimModalVisible(false);
      fetchPrizes();
    } catch (error) {
      console.error("Error claiming prize:", error);
      message.error("Failed to claim prize");
    }
  };

  const columns = [
    {
      title: "Tournament",
      dataIndex: "tournament_name",
      key: "tournament_name",
    },
    {
      title: "Place",
      dataIndex: "rank",
      key: "rank",
      render: (rank: number) => (
        <Tag
          color={
            rank === 1
              ? "gold"
              : rank === 2
                ? "silver"
                : rank === 3
                  ? "bronze"
                  : "default"
          }
        >
          {rank}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => moment(date).format("MMM D, YYYY"),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record: Prize) => (
        <Tag color={record.claimed ? "success" : "warning"}>
          {record.claimed ? "Claimed" : "Unclaimed"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Prize) =>
        !record.claimed && (
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedPrize(record);
              setClaimModalVisible(true);
            }}
          >
            Claim
          </Button>
        ),
    },
  ];

  return (
    <div className="prize-management">
      <Card
        title={
          <>
            <TrophyOutlined /> Prize Management
          </>
        }
      >
        <Tabs defaultActiveKey="unclaimed">
          <TabPane
            tab={
              <span>
                <DollarOutlined /> Unclaimed Prizes
              </span>
            }
            key="unclaimed"
          >
            <Table
              columns={columns}
              dataSource={unclaimedPrizes}
              rowKey={(record) =>
                `${record.tournament_id}-${record.participant_id}`
              }
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <CheckOutlined /> Prize History
              </span>
            }
            key="history"
          >
            <Table
              columns={columns}
              dataSource={prizeHistory}
              rowKey={(record) =>
                `${record.tournament_id}-${record.participant_id}`
              }
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Claim Prize"
        visible={claimModalVisible}
        onOk={handleClaimPrize}
        onCancel={() => {
          setSelectedPrize(null);
          setClaimModalVisible(false);
        }}
        okText="Claim"
        cancelText="Cancel"
      >
        {selectedPrize && (
          <p>
            Are you sure you want to claim your prize of{" "}
            <strong>${selectedPrize.amount.toFixed(2)}</strong> for placing{" "}
            <strong>{selectedPrize.rank}</strong> in{" "}
            <strong>{selectedPrize.tournament_name}</strong>?
          </p>
        )}
      </Modal>
    </div>
  );
};

export default PrizeManagement;

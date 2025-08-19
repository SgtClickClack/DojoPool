import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Input, Select, Pagination, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';

import { getVenues } from '../../api/venues';
import { type Venue } from '../../types/venue';

const { Option } = Select;

interface VenueListProps {
  onVenueSelect?: (venue: Venue) => void;
}

const VenueList: React.FC<VenueListProps> = ({ onVenueSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    name: '',
    is_verified: undefined as boolean | undefined,
  });

  const {
    data: venues,
    isLoading,
    error,
  } = useQuery(['venues', currentPage, pageSize, filters], () =>
    getVenues({
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...filters,
    })
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters((prev) => ({ ...prev, name: searchTerm }));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleVerifiedFilter = (value: boolean | undefined) => {
    setFilters((prev) => ({ ...prev, is_verified: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return <div>Error loading venues</div>;
  }

  return (
    <div className="venue-list">
      <div className="venue-list-filters" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Input
              placeholder="Search venues..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </Col>
          <Col span={12}>
            <Select
              placeholder="Filter by verification"
              style={{ width: '100%' }}
              allowClear
              onChange={handleVerifiedFilter}
            >
              <Option value="true">Verified</Option>
              <Option value="false">Unverified</Option>
            </Select>
          </Col>
        </Row>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : venues?.items?.length ? (
        <>
          <Row gutter={[16, 16]}>
            {venues.items.map((venue) => (
              <Col xs={24} sm={12} md={8} lg={6} key={venue.id}>
                <Card
                  hoverable
                  cover={
                    venue.photos && venue.photos.length > 0 && (
                      <img
                        alt={venue.name}
                        src={venue.photos[0]}
                        style={{ height: 200, objectFit: 'cover' }}
                      />
                    )
                  }
                  onClick={() => onVenueSelect?.(venue)}
                >
                  <Card.Meta
                    title={<Link to={`/venues/${venue.id}`}>{venue.name}</Link>}
                    description={
                      <>
                        <div>{venue.address.street}</div>
                        <div>
                          {venue.address.city}, {venue.address.state}
                        </div>
                        <div>
                          Tables: {venue.tables.length}
                          {venue.isVerified && (
                            <span
                              style={{
                                color: '#52c41a',
                                marginLeft: 8,
                              }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={venues.total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="No venues found" />
      )}
    </div>
  );
};

export default VenueList;

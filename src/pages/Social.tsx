import React from "react";
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Container,
  Heading,
} from "@chakra-ui/react";
import { Messages, UserProfile, Friends } from "../components/social";

export const SocialPage: React.FC = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6} color="white">
        Social Hub
      </Heading>

      <Tabs colorScheme="purple" variant="enclosed">
        <TabList>
          <Tab>Profile</Tab>
          <Tab>Friends</Tab>
          <Tab>Messages</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <UserProfile />
          </TabPanel>

          <TabPanel>
            <Friends />
          </TabPanel>

          <TabPanel>
            <Messages />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

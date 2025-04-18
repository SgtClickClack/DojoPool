import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  useTheme,
  Paper,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAnalytics } from "../services/AnalyticsService";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
}> = ({ title, value, subtitle }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" color="primary">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const RecentGamesList: React.FC<{
  games: Array<{
    date: string;
    opponent: string;
    result: string;
    score: { player: number; opponent: number };
  }>;
}> = ({ games }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Recent Games
      </Typography>
      <List>
        {games.map((game, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={`vs ${game.opponent}`}
                secondary={`${game.score.player} - ${
                  game.score.opponent
                } • ${new Date(game.date).toLocaleDateString()}`}
                sx={{
                  "& .MuiListItemText-primary": {
                    color:
                      game.result === "win"
                        ? "success.main"
                        : game.result === "loss"
                          ? "error.main"
                          : "text.primary",
                  },
                }}
              />
            </ListItem>
            {index < games.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </CardContent>
  </Card>
);

const ProgressionChart: React.FC<{
  data: Array<{
    date: string;
    accuracy: number;
    winRate: number;
  }>;
}> = ({ data }) => {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Progression
        </Typography>
        <Box sx={{ height: 300 }}>
          <LineChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke={theme.palette.primary.main}
              name="Accuracy %"
            />
            <Line
              type="monotone"
              dataKey="winRate"
              stroke={theme.palette.secondary.main}
              name="Win Rate %"
            />
          </LineChart>
        </Box>
      </CardContent>
    </Card>
  );
};

const ShotDistributionChart: React.FC<{
  data: Array<{
    type: string;
    percentage: number;
  }>;
}> = ({ data }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Shot Distribution
      </Typography>
      <Box sx={{ height: 300 }}>
        <PieChart width={400} height={300}>
          <Pie
            data={data}
            cx={200}
            cy={150}
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="percentage"
            nameKey="type"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </Box>
    </CardContent>
  </Card>
);

const MostUsedShotsChart: React.FC<{
  data: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
}> = ({ data }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Most Used Shots
      </Typography>
      <Box sx={{ height: 300 }}>
        <BarChart
          width={600}
          height={300}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="count"
            fill="#8884d8"
            name="Usage Count"
          />
          <Bar
            yAxisId="right"
            dataKey="successRate"
            fill="#82ca9d"
            name="Success Rate %"
          />
        </BarChart>
      </Box>
    </CardContent>
  </Card>
);

const AchievementsList: React.FC<{
  achievements: Array<{
    name: string;
    description: string;
    dateUnlocked: string;
  }>;
}> = ({ achievements }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Achievements
      </Typography>
      <List>
        {achievements.map((achievement, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={achievement.name}
                secondary={`${achievement.description} • Unlocked: ${new Date(
                  achievement.dateUnlocked,
                ).toLocaleDateString()}`}
              />
            </ListItem>
            {index < achievements.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </CardContent>
  </Card>
);

const SkillLevels: React.FC<{
  skills: Array<{
    category: string;
    level: number;
    progress: number;
  }>;
}> = ({ skills }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Skill Levels
      </Typography>
      <List>
        {skills.map((skill, index) => (
          <ListItem key={index}>
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body1">{skill.category}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Level {skill.level}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={skill.progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

export const AnalyticsDashboard: React.FC = () => {
  const { data } = useAnalytics();

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading analytics data...</Typography>
      </Box>
    );
  }

  const {
    gameAnalytics: {
      totalGames,
      totalShots,
      averageAccuracy,
      winRate,
      averageGameDuration,
      mostUsedShots,
      recentGames,
      progression,
      shotDistribution,
    },
    playerStats: { totalPlayTime, rank, rating, achievements, skillLevels },
  } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Game Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Games"
            value={totalGames}
            subtitle="Games played"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subtitle="Victory percentage"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Accuracy"
            value={`${averageAccuracy.toFixed(1)}%`}
            subtitle="Shot success rate"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Shots"
            value={totalShots}
            subtitle="Shots taken"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Game Duration"
            value={`${Math.round(averageGameDuration / 60)} min`}
            subtitle="Time per game"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Player Rating"
            value={rating}
            subtitle={`Rank #${rank}`}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ProgressionChart data={progression} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ShotDistributionChart data={shotDistribution} />
        </Grid>
        <Grid item xs={12} md={6}>
          <MostUsedShotsChart data={mostUsedShots} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RecentGamesList games={recentGames} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AchievementsList achievements={achievements} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SkillLevels skills={skillLevels} />
        </Grid>
      </Grid>
    </Box>
  );
};

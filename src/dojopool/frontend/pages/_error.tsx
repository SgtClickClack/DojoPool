import { type NextPageContext } from 'next';
import { Box, Typography } from '@mui/material';

interface ErrorProps {
  statusCode?: number;
}

function getStatusCode(ctx: NextPageContext): number | undefined {
  const res = ctx.res;
  const err = ctx.err;
  if (res) return res.statusCode;
  if (err) return err.statusCode;
  return undefined;
}

const Error = ({ statusCode }: ErrorProps) => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h2" color="error">
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client'}
    </Typography>
  </Box>
);

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

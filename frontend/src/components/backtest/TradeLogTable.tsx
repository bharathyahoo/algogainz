import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  Typography,
  TableSortLabel,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';
import type { BacktestTrade } from '../../types';

interface TradeLogTableProps {
  trades: BacktestTrade[];
}

type SortField = 'entryDate' | 'exitDate' | 'pnl' | 'pnlPct' | 'quantity';
type SortOrder = 'asc' | 'desc';

const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('entryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort and filter trades
  const sortedAndFilteredTrades = useMemo(() => {
    let filtered = trades;

    // Apply search filter
    if (searchTerm) {
      filtered = trades.filter(
        (trade) =>
          trade.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatDate(trade.entryDate).toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatDate(trade.exitDate).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'entryDate' || sortField === 'exitDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trades, sortField, sortOrder, searchTerm]);

  // Paginate trades
  const paginatedTrades = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedAndFilteredTrades.slice(start, end);
  }, [sortedAndFilteredTrades, page, rowsPerPage]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

    return {
      total: trades.length,
      winning: winningTrades.length,
      losing: losingTrades.length,
      totalPnL,
    };
  }, [trades]);

  if (!trades || trades.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No trades executed in this backtest
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      {/* Header with stats and search */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Trades
            </Typography>
            <Typography variant="h6">{stats.total}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Winning
            </Typography>
            <Typography variant="h6" color="success.main">
              {stats.winning}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Losing
            </Typography>
            <Typography variant="h6" color="error.main">
              {stats.losing}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total P&L
            </Typography>
            <Typography
              variant="h6"
              color={stats.totalPnL >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(stats.totalPnL)}
            </Typography>
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="Search trades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 250 }}
        />
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'entryDate'}
                  direction={sortField === 'entryDate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('entryDate')}
                >
                  Entry Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'exitDate'}
                  direction={sortField === 'exitDate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('exitDate')}
                >
                  Exit Date
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Entry Price</TableCell>
              <TableCell align="right">Exit Price</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'quantity'}
                  direction={sortField === 'quantity' ? sortOrder : 'asc'}
                  onClick={() => handleSort('quantity')}
                >
                  Quantity
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'pnl'}
                  direction={sortField === 'pnl' ? sortOrder : 'asc'}
                  onClick={() => handleSort('pnl')}
                >
                  P&L
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'pnlPct'}
                  direction={sortField === 'pnlPct' ? sortOrder : 'asc'}
                  onClick={() => handleSort('pnlPct')}
                >
                  P&L %
                </TableSortLabel>
              </TableCell>
              <TableCell>Result</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTrades.map((trade, index) => (
              <TableRow
                key={index}
                hover
                sx={{
                  bgcolor: trade.pnl >= 0 ? 'success.lighter' : 'error.lighter',
                  opacity: 0.9,
                }}
              >
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {formatDate(trade.entryDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {formatDate(trade.exitDate)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(trade.entryPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(trade.exitPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{trade.quantity}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={trade.pnl >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(trade.pnl)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={trade.pnlPct >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatPercent(trade.pnlPct)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={trade.type || (trade.pnl >= 0 ? 'WIN' : 'LOSS')}
                    size="small"
                    color={trade.pnl >= 0 ? 'success' : 'error'}
                    sx={{ minWidth: 60 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={sortedAndFilteredTrades.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TradeLogTable;

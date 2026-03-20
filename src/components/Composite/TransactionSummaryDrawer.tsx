import { ArrowRightOutlined, CloseCircleOutlined, DollarOutlined, RiseOutlined, FallOutlined, TagOutlined, RightSquareFilled, LeftSquareFilled, ClockCircleOutlined, ShareAltOutlined, CopyOutlined } from "@ant-design/icons";
import { MarketDerivedVolatility100Icon } from "@deriv/quill-icons";
import { Drawer, Button, Tag, Divider, Space, Typography } from "antd";

// Countdown Timer Component
export const TransactionSummaryDrawer = ({ onClose, drawerVisible, transactionSummaryData }) => {

    const { Title, Text } = Typography;
    // Handle export transaction
    const handleExportTransaction = () => {
        if (!transactionSummaryData) return;

        const exportText = `
=== TRANSACTION DETAILS ===

Session ID: ${transactionSummaryData.sessionId}
Bot ID: ${transactionSummaryData.botId}
Status: ${transactionSummaryData.status === 'won' ? 'WON' : 'LOST'}

=== TRADE INFORMATION ===
Description: ${transactionSummaryData.longcode}
Market: ${transactionSummaryData.symbol_full || transactionSummaryData.symbol}
Contract Type: ${transactionSummaryData.contract_type}

=== TIMING ===
Purchase Time: ${transactionSummaryData.purchase_time ? new Date(transactionSummaryData.purchase_time * 1000).toLocaleString() : new Date(transactionSummaryData.createdAt).toLocaleString()}
Exit Time: ${transactionSummaryData.sell_spot_time ? new Date(transactionSummaryData.sell_spot_time * 1000).toLocaleString() : 'N/A'}

=== PRICING ===
Entry Spot: ${transactionSummaryData.entry_spot_value?.toFixed(4) || '0.0000'}
Exit Spot: ${transactionSummaryData.exit_spot_value?.toFixed(4) || '0.0000'}
Stake Amount: ${transactionSummaryData.amount.toFixed(2)} ${transactionSummaryData.currency}
Payout: ${transactionSummaryData.payout?.toFixed(2) || '0.00'} ${transactionSummaryData.payout_currency || transactionSummaryData.currency}
Profit/Loss: ${transactionSummaryData.profit_value >= 0 ? '+' : ''}${transactionSummaryData.profit_value?.toFixed(2) || '0.00'} ${transactionSummaryData.currency}

=== SUMMARY ===
${transactionSummaryData.status === 'won' ? '✅ PROFITABLE TRADE' : '❌ LOSING TRADE'}
${Math.abs(transactionSummaryData.profit_percentage || 0).toFixed(2)}% ${transactionSummaryData.profit_value >= 0 ? 'gain' : 'loss'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

        // Check if Web Share API is supported (mobile devices)
        if (navigator.share && /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
            navigator.share({
                title: `Transaction ${transactionSummaryData.sessionId}`,
                text: exportText,
            }).catch((error) => {
                console.log('Share failed or was cancelled:', error);
                // Fallback to clipboard if share fails
                fallbackToClipboard(exportText);
            });
        } else {
            // Fallback for desktop or unsupported browsers
            fallbackToClipboard(exportText);
        }
    };

    // Fallback function to copy to clipboard
    const fallbackToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                // Show success message
                alert('Transaction details copied to clipboard!');
            }).catch((err) => {
                console.error('Failed to copy text: ', err);
                // Final fallback - create textarea and select
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Transaction details copied to clipboard!');
            });
        } else {
            // Legacy fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Transaction details copied to clipboard!');
        }
    };

    // Handle copy to clipboard
    const handleCopyToClipboard = () => {
        if (!transactionSummaryData) return;

        const copyText = `
=== TRANSACTION DETAILS ===

Session ID: ${transactionSummaryData.sessionId}
Bot ID: ${transactionSummaryData.botId}
Status: ${transactionSummaryData.status === 'won' ? 'WON' : 'LOST'}

=== TRADE INFORMATION ===
Description: ${transactionSummaryData.longcode}
Market: ${transactionSummaryData.symbol_full || transactionSummaryData.symbol}
Contract Type: ${transactionSummaryData.contract_type}

=== TIMING ===
Purchase Time: ${transactionSummaryData.purchase_time ? new Date(transactionSummaryData.purchase_time * 1000).toLocaleString() : new Date(transactionSummaryData.createdAt).toLocaleString()}
Exit Time: ${transactionSummaryData.sell_spot_time ? new Date(transactionSummaryData.sell_spot_time * 1000).toLocaleString() : 'N/A'}

=== PRICING ===
Entry Spot: ${transactionSummaryData.entry_spot_value}
Exit Spot: ${transactionSummaryData.exit_spot_value}
Stake Amount: ${transactionSummaryData.amount.toFixed(2)} ${transactionSummaryData.currency}
Payout: ${transactionSummaryData.payout?.toFixed(2) || '0.00'} ${transactionSummaryData.payout_currency || transactionSummaryData.currency}
Profit/Loss: ${transactionSummaryData.profit_value >= 0 ? '+' : ''}${transactionSummaryData.profit_value?.toFixed(2) || '0.00'} ${transactionSummaryData.currency}

=== SUMMARY ===
${transactionSummaryData.status === 'won' ? '✅ PROFITABLE TRADE' : '❌ LOSING TRADE'}
${Math.abs(transactionSummaryData.profit_percentage || 0).toFixed(2)}% ${transactionSummaryData.profit_value >= 0 ? 'gain' : 'loss'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

        fallbackToClipboard(copyText);
    };
    return (
        <Drawer
            title={null}
            placement="right"
            onClose={onClose}
            open={drawerVisible}
            size={600}
            className="transaction-details-drawer"
            closeIcon={null}
        >
            <div className="drawer-header">
                <Button
                    type="text"
                    icon={<ArrowRightOutlined rotate={180} />}
                    onClick={onClose}
                    className="back-button"
                />
                <Title level={4} className="drawer-title">Transaction Details</Title>
            </div>

            <div className="drawer-content">
                {transactionSummaryData && (
                    <div className="transaction-details">
                        {/* Header Section */}
                        <div className="detail-section">
                            <div className="detail-header">
                                <div className="detail-icon">
                                    <MarketDerivedVolatility100Icon fill='#ffffff' iconSize='lg' />
                                </div>
                                <div className="detail-info">
                                    <Title level={5}>{transactionSummaryData.symbol_full || transactionSummaryData.symbol}</Title>
                                    <Text type="secondary">{transactionSummaryData.symbol_short} &bull; {transactionSummaryData.contract_type}</Text>
                                </div>
                            </div>
                        </div>

                        {/* Trade Information */}
                        <div className="detail-section">
                            <Title level={5} className="section-title">Trade Information</Title>
                            <Title level={5} className="section-title">{transactionSummaryData.sessionId}</Title>
                            <div className="trade-info-list">
                                <div className="trade-info-row">
                                    <Text className="detail-label"><strong>Proposal: <br />{transactionSummaryData.proposal_id}</strong></Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><strong>{transactionSummaryData.longcode}</strong></Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><CloseCircleOutlined className="detail-label-icon" /> Duration</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.duration} {transactionSummaryData.duration_unit}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><DollarOutlined className="detail-label-icon" /> Stake Amount</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.amount.toFixed(2)} {transactionSummaryData.currency}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><DollarOutlined className="detail-label-icon" /> Potential Payout</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.payout?.toFixed(2) || '0.00'} {transactionSummaryData.payout_currency || transactionSummaryData.currency}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label">{transactionSummaryData.profit_value && transactionSummaryData.profit_value >= 0 ? <RiseOutlined className="detail-label-icon" /> : <FallOutlined className="detail-label-icon" />} Total Profit/Loss</Text>
                                    <Tag color={transactionSummaryData.status === 'won' ? 'green' : 'red'} className={transactionSummaryData.status === 'won' ? 'profit-loss-green' : 'profit-loss-red'}>{(transactionSummaryData.profit_value ?? 0) >= 0 ? '+' : ''}{(transactionSummaryData.profit_value ?? 0).toFixed(2)} {transactionSummaryData.currency}</Tag>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><TagOutlined className="detail-label-icon" /> Status</Text>
                                    <Tag color={transactionSummaryData.status === 'won' ? 'green' : 'red'} className="trade-type-tag">
                                        {transactionSummaryData.status === 'won' ? 'Won' : 'Lost'}
                                    </Tag>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><RightSquareFilled className="detail-label-icon" /> Entry Spot</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.entry_spot_value}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><LeftSquareFilled className="detail-label-icon" /> Exit Spot</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.exit_spot_value}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><LeftSquareFilled className="detail-label-icon" /> Sell Spot</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.sell_spot}</Text>
                                </div>
                                <div className="trade-divider" />
                                <Title level={5} className="section-title">Timestamps</Title>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Purchase Time</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.purchase_time ? new Date(transactionSummaryData.purchase_time * 1000).toLocaleString() : new Date(transactionSummaryData.createdAt).toLocaleString()}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Start Time</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.start_time ? new Date(transactionSummaryData.start_time * 1000).toLocaleString() : 'N/A'}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Expiry Time</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.expiry_time ? new Date(transactionSummaryData.expiry_time * 1000).toLocaleString() : 'N/A'}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Entry Time</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.entry_spot_time ? new Date(transactionSummaryData.entry_spot_time * 1000).toLocaleString() : 'N/A'}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Exit Time</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.exit_spot_time ? new Date(transactionSummaryData.exit_spot_time * 1000).toLocaleString() : 'N/A'}</Text>
                                </div>
                                <div className="trade-divider" />
                                <div className="trade-info-row">
                                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Sell Time</Text>
                                    <Text strong className="detail-value">{transactionSummaryData.sell_spot_time ? new Date(transactionSummaryData.sell_spot_time * 1000).toLocaleString() : new Date(transactionSummaryData.createdAt).toLocaleString()}</Text>
                                </div>
                                <div className="trade-divider" />
                            </div>
                        </div>

                        <Divider />

                        {/* Action Buttons */}
                        <Space className="action-buttons" vertical size={18} style={{ marginTop: 0, width: '100%', padding: 0 }}>
                            <Button
                                type="primary"
                                size="large"
                                block
                                icon={<ShareAltOutlined />}
                                onClick={handleExportTransaction}
                                className="submit-button"
                            >
                                Export Transaction
                            </Button>
                            <Button
                                type="default"
                                size="large"
                                block
                                icon={<CopyOutlined />}
                                onClick={handleCopyToClipboard}
                            >
                                Copy to Clipboard
                            </Button>
                            <Button
                                type="default"
                                size="large"
                                block
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </Space>
                    </div>
                )}
            </div>
        </Drawer>
    )

};

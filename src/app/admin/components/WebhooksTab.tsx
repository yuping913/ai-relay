'use client';

import { useState, useEffect } from 'react';

interface WebhooksTabProps {
  apiKey: string;
  lang: 'zh' | 'en';
  t: any;
  providers: any[];
  onRefreshData?: () => Promise<void>;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  platform: 'wecom' | 'feishu' | 'dingtalk' | 'slack' | 'generic';
  enabled: boolean;
  template?: string;
  createdAt: string;
  updatedAt: string;
}

interface AlertThreshold {
  provider: string;
  dailyRequestLimit?: number;
  dailyTokenLimit?: number;
}

interface WebhookSettings {
  webhooks: WebhookConfig[];
  alertThresholds: AlertThreshold[];
  reportTime: string;
  reportTimezone: string;
}

const PLATFORM_OPTIONS = [
  { value: 'wecom', label: '企业微信 (WeCom)', emoji: '💬' },
  { value: 'feishu', label: '飞书 (Feishu)', emoji: '🐦' },
  { value: 'dingtalk', label: '钉钉 (DingTalk)', emoji: '🔔' },
  { value: 'slack', label: 'Slack', emoji: '💼' },
  { value: 'generic', label: 'Generic (HTTP)', emoji: '🌐' },
] as const;

const PLATFORM_LABELS: Record<string, { zh: string; en: string; emoji: string }> = {
  wecom: { zh: '企业微信', en: 'WeCom', emoji: '💬' },
  feishu: { zh: '飞书', en: 'Feishu', emoji: '🐦' },
  dingtalk: { zh: '钉钉', en: 'DingTalk', emoji: '🔔' },
  slack: { zh: 'Slack', en: 'Slack', emoji: '💼' },
  generic: { zh: '通用 HTTP', en: 'Generic HTTP', emoji: '🌐' },
};

// Shared inline styles
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  color: '#d1d5db',
  fontSize: '0.9rem',
  fontWeight: 500,
  marginBottom: '0.35rem',
  display: 'block',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#4361ee',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
};

const btnDanger: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  border: '1px solid rgba(239, 68, 68, 0.4)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#f87171',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
};

const btnOutline: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  color: '#d1d5db',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
};

export default function WebhooksTab({ apiKey, lang, providers, onRefreshData }: WebhooksTabProps) {
  // ---- i18n ----
  const i = lang === 'zh' ? {
    sectionTitle: '🔔 Webhook 通知管理',
    sectionDesc: '配置 Webhook 通知端点，当监控指标超过阈值或定时日报时自动推送消息。',
    addWebhook: '➕ 添加 Webhook',
    editWebhook: '编辑',
    deleteWebhook: '删除',
    testWebhook: '🧪 测试',
    testing: '测试中...',
    testSuccess: '✅ 测试消息发送成功！',
    testFailed: '❌ 测试失败',
    nameLabel: '名称',
    namePlaceholder: '例如：运维告警群',
    urlLabel: 'Webhook URL',
    urlPlaceholder: 'https://...',
    platformLabel: '平台',
    enabledLabel: '启用',
    templateLabel: '自定义模板 (JSON)',
    templatePlaceholder: '仅 generic 平台需要，留空使用默认格式',
    save: '保存',
    cancel: '取消',
    confirmDelete: '确定要删除此 Webhook 吗？',
    noWebhooks: '尚未配置任何 Webhook 通知端点。',
    thresholdTitle: '⚡ 告警阈值设置',
    thresholdDesc: '为每个服务商设置日请求数和日 Token 数阈值，超限时自动通过上方 Webhook 推送告警。',
    providerCol: '服务商',
    dailyRequestLimitCol: '日请求上限',
    dailyTokenLimitCol: '日 Token 上限',
    saveThresholds: '保存阈值',
    thresholdSaved: '✅ 告警阈值保存成功',
    thresholdFailed: '❌ 保存告警阈值失败',
    unlimitedPlaceholder: '不限',
    enabled: '已启用',
    disabled: '已禁用',
    createdAt: '创建于',
    updatedAt: '更新于',
    webhookSaved: '✅ Webhook 保存成功',
    webhookDeleted: '✅ Webhook 已删除',
    saveFailed: '❌ 保存失败',
    deleteFailed: '❌ 删除失败',
    reportTitle: '📊 定时日报设置',
    reportDesc: '每天在指定时间自动推送当日用量汇总到已启用的 Webhook。',
    reportTimeLabel: '推送时间 (HH:mm)',
    reportTimezoneLabel: '时区',
    saveReport: '保存日报设置',
    reportSaved: '✅ 日报设置保存成功',
    reportFailed: '❌ 日报设置保存失败',
  } : {
    sectionTitle: '🔔 Webhook Notifications',
    sectionDesc: 'Configure webhook endpoints for alert notifications and scheduled daily reports.',
    addWebhook: '➕ Add Webhook',
    editWebhook: 'Edit',
    deleteWebhook: 'Delete',
    testWebhook: '🧪 Test',
    testing: 'Testing...',
    testSuccess: '✅ Test message sent successfully!',
    testFailed: '❌ Test failed',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Ops Alert Channel',
    urlLabel: 'Webhook URL',
    urlPlaceholder: 'https://...',
    platformLabel: 'Platform',
    enabledLabel: 'Enabled',
    templateLabel: 'Custom Template (JSON)',
    templatePlaceholder: 'Only for generic platform, leave empty for default',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this webhook?',
    noWebhooks: 'No webhook endpoints configured yet.',
    thresholdTitle: '⚡ Alert Thresholds',
    thresholdDesc: 'Set daily request and token limits per provider. Alerts are pushed via webhooks above when exceeded.',
    providerCol: 'Provider',
    dailyRequestLimitCol: 'Daily Request Limit',
    dailyTokenLimitCol: 'Daily Token Limit',
    saveThresholds: 'Save Thresholds',
    thresholdSaved: '✅ Alert thresholds saved successfully',
    thresholdFailed: '❌ Failed to save thresholds',
    unlimitedPlaceholder: 'Unlimited',
    enabled: 'Enabled',
    disabled: 'Disabled',
    createdAt: 'Created',
    updatedAt: 'Updated',
    webhookSaved: '✅ Webhook saved successfully',
    webhookDeleted: '✅ Webhook deleted',
    saveFailed: '❌ Save failed',
    deleteFailed: '❌ Delete failed',
    reportTitle: '📊 Scheduled Daily Report',
    reportDesc: 'Automatically push a daily usage summary to enabled webhooks at the specified time.',
    reportTimeLabel: 'Report Time (HH:mm)',
    reportTimezoneLabel: 'Timezone',
    saveReport: 'Save Report Settings',
    reportSaved: '✅ Report settings saved successfully',
    reportFailed: '❌ Failed to save report settings',
  };

  // ---- State ----
  const [settings, setSettings] = useState<WebhookSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formPlatform, setFormPlatform] = useState<string>('wecom');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formTemplate, setFormTemplate] = useState('');
  const [saving, setSaving] = useState(false);

  // Test
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);

  // Thresholds
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Report settings
  const [reportTime, setReportTime] = useState('21:00');
  const [reportTimezone, setReportTimezone] = useState('Asia/Shanghai');
  const [savingReport, setSavingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ---- Load settings ----
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/webhooks', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const s: WebhookSettings = data.settings || { webhooks: [], alertThresholds: [], reportTime: '21:00', reportTimezone: 'Asia/Shanghai' };
      setSettings(s);

      // Initialize thresholds — merge providers with existing
      const existing = s.alertThresholds || [];
      const merged = providers.map(p => {
        const found = existing.find(t => t.provider === p.id);
        return found || { provider: p.id };
      });
      setThresholds(merged);
      setReportTime(s.reportTime || '21:00');
      setReportTimezone(s.reportTimezone || 'Asia/Shanghai');
    } catch {
      setSettings({ webhooks: [], alertThresholds: [], reportTime: '21:00', reportTimezone: 'Asia/Shanghai' });
      // Initialize with empty thresholds for providers
      setThresholds(providers.map(p => ({ provider: p.id })));
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ---- Helpers ----
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const showThresholdMessage = (text: string, type: 'success' | 'error') => {
    setThresholdMessage({ text, type });
    setTimeout(() => setThresholdMessage(null), 4000);
  };

  const showReportMessage = (text: string, type: 'success' | 'error') => {
    setReportMessage({ text, type });
    setTimeout(() => setReportMessage(null), 4000);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormUrl('');
    setFormPlatform('wecom');
    setFormEnabled(true);
    setFormTemplate('');
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (wh: WebhookConfig) => {
    setEditingId(wh.id);
    setFormName(wh.name);
    setFormUrl(wh.url);
    setFormPlatform(wh.platform);
    setFormEnabled(wh.enabled);
    setFormTemplate(wh.template || '');
    setModalOpen(true);
  };

  // ---- API handlers ----
  const handleSave = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body: any = {
        name: formName.trim(),
        url: formUrl.trim(),
        platform: formPlatform,
        enabled: formEnabled,
      };
      if (formTemplate.trim()) body.template = formTemplate.trim();
      if (editingId) body.id = editingId;

      const res = await fetch('/api/admin/webhooks', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Save failed');

      showMessage(i.webhookSaved, 'success');
      setModalOpen(false);
      resetForm();
      await fetchSettings();
      if (onRefreshData) await onRefreshData();
    } catch (e: any) {
      showMessage(`${i.saveFailed}: ${e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(i.confirmDelete)) return;
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Delete failed');

      showMessage(i.webhookDeleted, 'success');
      await fetchSettings();
      if (onRefreshData) await onRefreshData();
    } catch (e: any) {
      showMessage(`${i.deleteFailed}: ${e.message}`, 'error');
    }
  };

  const handleTest = async (webhookId: string) => {
    setTestingId(webhookId);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ webhookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Test failed');
      setTestResult({ id: webhookId, success: true });
    } catch (e: any) {
      setTestResult({ id: webhookId, success: false, error: e.message });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleEnabled = async (wh: WebhookConfig) => {
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ id: wh.id, enabled: !wh.enabled }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      await fetchSettings();
    } catch {
      // silent
    }
  };

  const handleSaveThresholds = async () => {
    setSavingThresholds(true);
    try {
      // Only send thresholds that have at least one limit set
      const payload = thresholds.filter(t => t.dailyRequestLimit || t.dailyTokenLimit);
      const res = await fetch('/api/admin/webhooks/thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ thresholds: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Save failed');
      showThresholdMessage(i.thresholdSaved, 'success');
    } catch (e: any) {
      showThresholdMessage(`${i.thresholdFailed}: ${e.message}`, 'error');
    } finally {
      setSavingThresholds(false);
    }
  };

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ reportTime, reportTimezone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Save failed');
      showReportMessage(i.reportSaved, 'success');
    } catch (e: any) {
      showReportMessage(`${i.reportFailed}: ${e.message}`, 'error');
    } finally {
      setSavingReport(false);
    }
  };

  const updateThreshold = (provider: string, field: 'dailyRequestLimit' | 'dailyTokenLimit', value: string) => {
    setThresholds(prev => prev.map(t => {
      if (t.provider !== provider) return t;
      const num = value === '' ? undefined : parseInt(value, 10);
      return { ...t, [field]: (num !== undefined && !isNaN(num) && num > 0) ? num : undefined };
    }));
  };

  // ---- Render ----
  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#9ca3af' }}>
        <span className="spin">🔄</span>&nbsp;{lang === 'zh' ? '加载中...' : 'Loading...'}
      </div>
    );
  }

  const webhooks = settings?.webhooks || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-select {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg fill='none' height='24' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1rem;
          padding-right: 2rem !important;
        }
        .wh-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          transition: all 0.2s;
        }
        .wh-card:hover {
          border-color: rgba(67, 97, 238, 0.3);
          box-shadow: 0 0 12px rgba(67, 97, 238, 0.08);
        }
        .toggle-switch {
          position: relative;
          width: 40px;
          height: 22px;
          border-radius: 11px;
          cursor: pointer;
          transition: background-color 0.3s;
          border: none;
          outline: none;
          flex-shrink: 0;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          transition: transform 0.3s;
        }
        .toggle-switch.active {
          background-color: #4361ee;
        }
        .toggle-switch.active::after {
          transform: translateX(18px);
        }
        .toggle-switch.inactive {
          background-color: rgba(255, 255, 255, 0.12);
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          max-width: 520px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }
        .threshold-input {
          width: 120px;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(0, 0, 0, 0.25);
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .threshold-input:focus {
          border-color: rgba(67, 97, 238, 0.5);
        }
      `}} />

      {/* Section 1: Webhook List */}
      <section className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
              {i.sectionTitle}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
              {i.sectionDesc}
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{
              ...btnPrimary,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3651d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4361ee'; }}
          >
            {i.addWebhook}
          </button>
        </div>

        {/* Message banner */}
        {message && (
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            marginTop: '0.75rem',
            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}>
            {message.text}
          </div>
        )}

        {/* Webhook cards */}
        {webhooks.length === 0 ? (
          <div style={{
            marginTop: '1.25rem',
            padding: '1.5rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            color: '#6b7280',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}>
            {i.noWebhooks}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
            {webhooks.map((wh) => {
              const plat = PLATFORM_LABELS[wh.platform] || PLATFORM_LABELS.generic;
              const isTesting = testingId === wh.id;
              const result = testResult?.id === wh.id ? testResult : null;

              return (
                <div key={wh.id} className="wh-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Left: Info */}
                    <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{plat.emoji}</span>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{wh.name}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: wh.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                          color: wh.enabled ? '#34d399' : '#6b7280',
                          fontWeight: 500,
                        }}>
                          {wh.enabled ? i.enabled : i.disabled}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '0.25rem' }}>
                        {wh.url.length > 70 ? wh.url.substring(0, 70) + '...' : wh.url}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                        {lang === 'zh' ? plat.zh : plat.en}
                        {wh.updatedAt && ` · ${i.updatedAt} ${new Date(wh.updatedAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}`}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {/* Toggle */}
                      <button
                        className={`toggle-switch ${wh.enabled ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleEnabled(wh)}
                        title={wh.enabled ? i.enabled : i.disabled}
                      />

                      {/* Test */}
                      <button
                        onClick={() => handleTest(wh.id)}
                        disabled={isTesting}
                        style={{
                          ...btnOutline,
                          borderColor: result?.success === true ? 'rgba(16, 185, 129, 0.4)' : result?.success === false ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)',
                          color: result?.success === true ? '#34d399' : result?.success === false ? '#f87171' : '#d1d5db',
                          opacity: isTesting ? 0.6 : 1,
                          cursor: isTesting ? 'wait' : 'pointer',
                        }}
                        onMouseEnter={(e) => { if (!isTesting) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                        onMouseLeave={(e) => { if (!isTesting) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
                      >
                        {isTesting ? i.testing : result?.success === true ? i.testSuccess.substring(0, 6) : result?.success === false ? i.testFailed.substring(0, 6) : i.testWebhook}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(wh)}
                        style={btnOutline}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
                      >
                        ✏️ {i.editWebhook}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(wh.id)}
                        style={btnDanger}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Test error detail */}
                  {result?.success === false && result.error && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.12)',
                      color: '#fca5a5',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}>
                      {result.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Alert Thresholds */}
      <section className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
          {i.thresholdTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 0, marginBottom: '1.25rem', lineHeight: '1.5' }}>
          {i.thresholdDesc}
        </p>

        {thresholdMessage && (
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            backgroundColor: thresholdMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${thresholdMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: thresholdMessage.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}>
            {thresholdMessage.text}
          </div>
        )}

        {providers.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {lang === 'zh' ? '暂无已配置的服务商' : 'No providers configured'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', whiteSpace: 'nowrap' }}>
                      {i.providerCol}
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.6rem 0.75rem', color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', whiteSpace: 'nowrap' }}>
                      {i.dailyRequestLimitCol}
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.6rem 0.75rem', color: '#9ca3af', fontWeight: 500, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', whiteSpace: 'nowrap' }}>
                      {i.dailyTokenLimitCol}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {thresholds.map((th) => {
                    const prov = providers.find(p => p.id === th.provider);
                    return (
                      <tr key={th.provider}>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#e5e7eb', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          {prov?.name || th.provider}
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>({th.provider})</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <input
                            type="number"
                            min="0"
                            placeholder={i.unlimitedPlaceholder}
                            value={th.dailyRequestLimit ?? ''}
                            onChange={(e) => updateThreshold(th.provider, 'dailyRequestLimit', e.target.value)}
                            className="threshold-input"
                          />
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <input
                            type="number"
                            min="0"
                            placeholder={i.unlimitedPlaceholder}
                            value={th.dailyTokenLimit ?? ''}
                            onChange={(e) => updateThreshold(th.provider, 'dailyTokenLimit', e.target.value)}
                            className="threshold-input"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                onClick={handleSaveThresholds}
                disabled={savingThresholds}
                style={{
                  ...btnPrimary,
                  backgroundColor: '#10b981',
                  opacity: savingThresholds ? 0.6 : 1,
                  cursor: savingThresholds ? 'wait' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!savingThresholds) e.currentTarget.style.backgroundColor = '#059669'; }}
                onMouseLeave={(e) => { if (!savingThresholds) e.currentTarget.style.backgroundColor = '#10b981'; }}
              >
                {savingThresholds ? '...' : i.saveThresholds}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Section 3: Daily Report Settings */}
      <section className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
          {i.reportTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 0, marginBottom: '1.25rem', lineHeight: '1.5' }}>
          {i.reportDesc}
        </p>

        {reportMessage && (
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            backgroundColor: reportMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${reportMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: reportMessage.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}>
            {reportMessage.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={labelStyle}>{i.reportTimeLabel}</label>
            <input
              type="time"
              value={reportTime}
              onChange={(e) => setReportTime(e.target.value)}
              style={{ ...inputStyle, width: '140px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={labelStyle}>{i.reportTimezoneLabel}</label>
            <select
              value={reportTimezone}
              onChange={(e) => setReportTimezone(e.target.value)}
              className="custom-select"
              style={{ ...inputStyle, width: '220px', cursor: 'pointer' }}
            >
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <button
            onClick={handleSaveReport}
            disabled={savingReport}
            style={{
              ...btnPrimary,
              backgroundColor: '#10b981',
              opacity: savingReport ? 0.6 : 1,
              cursor: savingReport ? 'wait' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!savingReport) e.currentTarget.style.backgroundColor = '#059669'; }}
            onMouseLeave={(e) => { if (!savingReport) e.currentTarget.style.backgroundColor = '#10b981'; }}
          >
            {savingReport ? '...' : i.saveReport}
          </button>
        </div>
      </section>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); resetForm(); }}}>
          <div className="modal-content">
            <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600, margin: '0 0 1.5rem 0' }}>
              {editingId ? `✏️ ${i.editWebhook}` : i.addWebhook}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>{i.nameLabel}</label>
                <input
                  type="text"
                  placeholder={i.namePlaceholder}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(67, 97, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>

              {/* URL */}
              <div>
                <label style={labelStyle}>{i.urlLabel}</label>
                <input
                  type="url"
                  placeholder={i.urlPlaceholder}
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(67, 97, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>

              {/* Platform */}
              <div>
                <label style={labelStyle}>{i.platformLabel}</label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="custom-select"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {PLATFORM_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enabled toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{i.enabledLabel}</label>
                <button
                  className={`toggle-switch ${formEnabled ? 'active' : 'inactive'}`}
                  onClick={() => setFormEnabled(!formEnabled)}
                  type="button"
                />
                <span style={{ fontSize: '0.8rem', color: formEnabled ? '#34d399' : '#6b7280' }}>
                  {formEnabled ? i.enabled : i.disabled}
                </span>
              </div>

              {/* Template (only for generic) */}
              {formPlatform === 'generic' && (
                <div>
                  <label style={labelStyle}>{i.templateLabel}</label>
                  <textarea
                    placeholder={i.templatePlaceholder}
                    value={formTemplate}
                    onChange={(e) => setFormTemplate(e.target.value)}
                    rows={4}
                    style={{
                      ...inputStyle,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(67, 97, 238, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                style={btnOutline}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
              >
                {i.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim() || !formUrl.trim()}
                style={{
                  ...btnPrimary,
                  opacity: (saving || !formName.trim() || !formUrl.trim()) ? 0.5 : 1,
                  cursor: saving ? 'wait' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#3651d4'; }}
                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#4361ee'; }}
              >
                {saving ? '...' : i.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

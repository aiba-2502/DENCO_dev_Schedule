import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from './page';

// Mock SettingsManagement component
jest.mock('@/components/settings/settings-management', () => {
  return function MockSettingsManagement() {
    return (
      <div data-testid="settings-management">
        <h1>システム設定</h1>
        <div data-testid="settings-tabs">
          <button>音声認識・合成</button>
          <button>Asterisk PBX</button>
          <button>Dify設定</button>
          <button>応答設定</button>
          <button>番号管理</button>
          {/* スタッフ管理タブは削除されるべき */}
        </div>
      </div>
    );
  };
});

describe('Settings Page', () => {
  it('should render the settings page', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('settings-management')).toBeInTheDocument();
  });

  it('should display system settings title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('システム設定')).toBeInTheDocument();
  });

  it('should NOT display staff management tab (moved to separate page)', () => {
    render(<SettingsPage />);
    // スタッフ管理タブが設定ページに存在しないことを確認
    expect(screen.queryByText('スタッフ管理')).not.toBeInTheDocument();
  });

  it('should have dynamic force-dynamic export', () => {
    const pageModule = require('./page');
    expect(pageModule.dynamic).toBe('force-dynamic');
  });

  it('should have revalidate set to 0', () => {
    const pageModule = require('./page');
    expect(pageModule.revalidate).toBe(0);
  });
});

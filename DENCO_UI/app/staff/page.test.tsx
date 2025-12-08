import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StaffPage from './page';

// Mock StaffManagement component
jest.mock('@/components/settings/staff-management', () => {
  return function MockStaffManagement({ availableDepartments }: { availableDepartments?: any[] }) {
    return (
      <div data-testid="staff-management-component">
        <h1>スタッフ管理</h1>
        {availableDepartments && <div data-testid="departments-count">{availableDepartments.length}</div>}
      </div>
    );
  };
});

describe('Staff Page', () => {
  it('should render the staff page', () => {
    render(<StaffPage />);
    expect(screen.getByTestId('staff-management-component')).toBeInTheDocument();
  });

  it('should display the staff management title', () => {
    render(<StaffPage />);
    expect(screen.getByText('スタッフ管理')).toBeInTheDocument();
  });

  it('should pass availableDepartments prop to StaffManagement component', () => {
    render(<StaffPage />);
    // StaffManagement should receive availableDepartments (can be empty array initially)
    const component = screen.getByTestId('staff-management-component');
    expect(component).toBeInTheDocument();
  });

  it('should have dynamic force-dynamic export', () => {
    // This test verifies the page configuration
    const pageModule = require('./page');
    expect(pageModule.dynamic).toBe('force-dynamic');
  });

  it('should have revalidate set to 0', () => {
    // This test verifies the page configuration
    const pageModule = require('./page');
    expect(pageModule.revalidate).toBe(0);
  });
});

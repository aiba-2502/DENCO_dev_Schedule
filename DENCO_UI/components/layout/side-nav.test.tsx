import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SideNav from './side-nav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('SideNav Component', () => {
  it('should render all navigation items including staff management', () => {
    render(<SideNav />);

    // Verify all existing navigation items
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('通話モニター')).toBeInTheDocument();
    expect(screen.getByText('AI架電')).toBeInTheDocument();
    expect(screen.getByText('通話履歴')).toBeInTheDocument();
    expect(screen.getByText('FAX管理')).toBeInTheDocument();
    expect(screen.getByText('顧客管理')).toBeInTheDocument();
    expect(screen.getByText('ナレッジデータベース')).toBeInTheDocument();
    expect(screen.getByText('通知設定')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('should have staff management navigation item', () => {
    render(<SideNav />);
    expect(screen.getByText('スタッフ管理')).toBeInTheDocument();
  });

  it('should have correct href for staff management', () => {
    render(<SideNav />);
    const staffLink = screen.getByText('スタッフ管理').closest('a');
    expect(staffLink).toHaveAttribute('href', '/staff');
  });

  it('should position staff management between customer management and knowledge database', () => {
    render(<SideNav />);

    // Get all navigation items
    const navItems = screen.getAllByRole('link');
    const itemTexts = navItems.map(item => item.textContent);

    // Find the indices
    const customerIndex = itemTexts.findIndex(text => text === '顧客管理');
    const staffIndex = itemTexts.findIndex(text => text === 'スタッフ管理');
    const knowledgeIndex = itemTexts.findIndex(text => text === 'ナレッジデータベース');

    // Verify the order
    expect(customerIndex).toBeLessThan(staffIndex);
    expect(staffIndex).toBeLessThan(knowledgeIndex);
  });

  it('should render staff management icon', () => {
    const { container } = render(<SideNav />);

    // Find the staff management link
    const staffLink = screen.getByText('スタッフ管理').closest('a');

    // Verify that the icon is rendered (Users icon from lucide-react)
    expect(staffLink?.querySelector('svg')).toBeInTheDocument();
  });
});

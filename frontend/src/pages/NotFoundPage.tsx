import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

export default function NotFoundPage() {
  return (
    <div>
      <h1>404 - 페이지를 찾을 수 없습니다</h1>
      <Link to={ROUTES.TODOS}>홈으로 이동</Link>
    </div>
  );
}

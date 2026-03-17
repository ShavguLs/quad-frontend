import React from 'react';

import type { User } from '../types';
import { ProfileView } from '../components/ProfileView';

interface ProfilePageProps {
  user: User | null;
  onBack: () => void;
  onUserUpdate: (user: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onUserUpdate }) => {
  return <ProfileView user={user} onBack={onBack} onUserUpdate={onUserUpdate} />;
};

export default ProfilePage;

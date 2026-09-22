import React, { useState } from 'react';
import { LoginView } from './LoginView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { RolesView } from './RolesView';
import { RoleVerificationNoticeView } from './RoleVerificationNoticeView';
import { CreateEmailView } from './CreateEmailView';
import { CreateNameView } from './CreateNameView';
import { CreatePasswordView } from './CreatePasswordView';
import { PrivacyPolicyView } from '../legal/PrivacyPolicyView';
import { TermsOfServiceView } from '../legal/TermsOfServiceView';

export type AuthScreenType = 
  | 'login' 
  | 'forgot-password' 
  | 'roles' 
  | 'role-notice' 
  | 'create-email' 
  | 'create-name' 
  | 'create-password'
  | 'privacy'
  | 'terms';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScreen?: AuthScreenType;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialScreen = 'login',
}) => {
  const [screen, setScreen] = useState<AuthScreenType>(initialScreen);
  const [selectedRole, setSelectedRole] = useState<string>('Listener');
  const [registrationEmail, setRegistrationEmail] = useState<string>('');
  const [registrationName, setRegistrationName] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div 
      id="auth-modal-screen"
      className="fixed inset-0 z-50 bg-black overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      <div className={`w-full flex-1 flex flex-col ${screen === 'privacy' || screen === 'terms' ? 'justify-start' : 'justify-center'} py-6`}>
        {screen === 'login' && (
          <LoginView
            onForgotPassword={() => setScreen('forgot-password')}
            onContinueWithEmail={() => setScreen('roles')}
            onSuccess={onClose}
            onClose={onClose}
            onOpenPrivacy={() => setScreen('privacy')}
            onOpenTerms={() => setScreen('terms')}
          />
        )}

        {screen === 'forgot-password' && (
          <ForgotPasswordView
            onBack={() => setScreen('login')}
            onDone={() => setScreen('login')}
          />
        )}

        {screen === 'roles' && (
          <RolesView
            onBack={() => setScreen('login')}
            onSelectListener={() => {
              setSelectedRole('Listener');
              setScreen('create-email');
            }}
            onSelectOtherRole={(roleName) => {
              setSelectedRole(roleName);
              setScreen('role-notice');
            }}
          />
        )}

        {screen === 'role-notice' && (
          <RoleVerificationNoticeView
            role={selectedRole}
            onBack={() => setScreen('roles')}
          />
        )}

        {screen === 'create-email' && (
          <CreateEmailView
            initialEmail={registrationEmail}
            onBack={() => setScreen('roles')}
            onNext={(email) => {
              setRegistrationEmail(email);
              setScreen('create-name');
            }}
          />
        )}

        {screen === 'create-name' && (
          <CreateNameView
            initialName={registrationName}
            onBack={() => setScreen('create-email')}
            onNext={(name) => {
              setRegistrationName(name);
              setScreen('create-password');
            }}
          />
        )}

        {screen === 'create-password' && (
          <CreatePasswordView
            email={registrationEmail}
            name={registrationName}
            onBack={() => setScreen('create-name')}
            onSuccess={onClose}
          />
        )}

        {screen === 'privacy' && (
          <PrivacyPolicyView
            onBack={() => setScreen('login')}
          />
        )}

        {screen === 'terms' && (
          <TermsOfServiceView
            onBack={() => setScreen('login')}
          />
        )}
      </div>
    </div>
  );
};

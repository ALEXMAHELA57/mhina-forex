import { useEffect, useState } from 'react';
import { useProfile } from '../lib/useProfile.js';
import { supabase } from '../lib/supabaseClient.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Account() {
  const { profile, loading } = useProfile();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    // Direct Supabase update — safe because the 08_account_security.sql
    // trigger strips out any attempt to change role/tier/access_status
    // from a non-service-role request, so only username/full_name
    // actually go through here regardless of what's sent.
    const { error } = await supabase
      .from('profiles')
      .update({ username, full_name: fullName })
      .eq('id', profile.id);

    setSavingProfile(false);
    setProfileMsg(error ? error.message : 'Saved.');
  }

  async function savePassword(e) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) setPasswordMsg(error.message);
    else {
      setPasswordMsg('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  if (loading || !profile) return <p>Loading…</p>;

  return (
    <div className="account-page">
      <h1>Account</h1>

      <section className="account-section">
        <h2>Profile</h2>
        <form onSubmit={saveProfile}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <p className="account-readonly">Email: {profile.email || 'Not set'}</p>
          {profileMsg && <p className={profileMsg === 'Saved.' ? 'success-msg' : 'error'}>{profileMsg}</p>}
          <button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</button>
        </form>
      </section>

      <section className="account-section">
        <h2>Change password</h2>
        <form onSubmit={savePassword}>
          <PasswordInput placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <PasswordInput placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {passwordMsg && <p className={passwordMsg === 'Password updated.' ? 'success-msg' : 'error'}>{passwordMsg}</p>}
          <button type="submit" disabled={savingPassword}>{savingPassword ? 'Saving…' : 'Update password'}</button>
        </form>
      </section>
    </div>
  );
}

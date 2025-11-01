import { useState, useEffect } from 'react';

export const useUserId = () => {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('ai_assistant_user_id');

    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ai_assistant_user_id', id);
    }

    setUserId(id);
  }, []);

  return userId;
};

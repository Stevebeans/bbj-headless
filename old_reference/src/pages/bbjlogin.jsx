"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Image from "next/image";

const BbjLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, user } = useAuth();
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState("/dashboard"); // Default redirect path

  useEffect(() => {
    const { referrer } = router.query;
    if (referrer) {
      setRedirectPath(decodeURIComponent(referrer));
    }
  }, [router.query]);

  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, redirectPath]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(username, password);
      router.push(redirectPath); // Redirect to the referrer or default page after login
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="border flex flex-col md:flex-row p-2">
      <div className="w-full md:w-1/3">
        <h1 className="text-lg font-semibold text-center text-secondary500">Login To Join The Conversation</h1>
        <Image src="/images/group.png" alt="Big Brother Junkies" width={200} height={200} className="mx-auto" />
      </div>
      <div className="flex justify-center flex-col items-center grow">
        <form onSubmit={handleSubmit} className="w-1/2">
          <div className="m-4 w-full">
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full" />
          </div>
          <div className="m-4 w-full">
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full" />
          </div>
          <div className="m-4 w-full flex flex-col justify-center items-center">
            <button type="submit" className="btn !w-32 mb-4">
              Login
            </button>
            <div>Forgot Password | Register</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BbjLogin;

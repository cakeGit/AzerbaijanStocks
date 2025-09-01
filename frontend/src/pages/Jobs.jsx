import React from 'react';
import { Link } from 'react-router-dom';

const Jobs = () => {
  return (
    <div className="jobs-page">
      <h1 className="text-4xl font-bold mb-8 text-center">J*bs</h1>
      <p className="mb-8 text-center text-lg">Earn money through various jobs. Each job is balanced to earn approximately $50 per 2 minutes of work. Leaderboards track the max earned in one round.</p>

      <div className="space-y-8">
        {/* McKing Job */}
        <div className="job-card bg-red-500/10 backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg">
          <h2 className="text-3xl font-semibold mb-6 text-center">🍔 McKing</h2>
          <p className="mb-6 text-center text-lg">Work at a McKing restaurant with timed cooking gameplay like Cooking Fever, but better.</p>
          <div className="text-center">
            <Link to="/jobs/mcking">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold">
                Start McKing Job
              </button>
            </Link>
          </div>
        </div>

        {/* Secretary Job */}
        <div className="job-card bg-blue-500/10 backdrop-blur-sm p-8 rounded-xl border border-border shadow-lg">
          <h2 className="text-3xl font-semibold mb-6 text-center">📧 Secretary</h2>
          <p className="mb-6 text-center text-lg">Emails scroll across the screen. Categorize them into "Important", "Not Important", or "Spam" before they reach the edge.</p>
          <div className="text-center">
            <Link to="/jobs/secretary">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold">
                Start Secretary Job
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;

import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Star, TrendingUp, Medal, Award, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const LeaderboardPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [leaderboard, setLeaderboard] = useState({
    overall: [],
    monthly: [],
    departmental: [],
    metrics: {},
    loading: true
  });
  const [activeTab, setActiveTab] = useState('overall');

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLeaderboard(prev => ({ ...prev, loading: true }));
      
      // Fetch real leaderboard data from API
      const response = await api.get('/analytics/leaderboard');
      
      if (response.data.success) {
        const data = response.data.data;
        setLeaderboard({
          overall: data.overall || [],
          monthly: data.monthly || [],
          departmental: data.departmental || [],
          metrics: data.metrics || {
            totalParticipants: 0,
            averageScore: 0,
            topDepartment: 'N/A',
            improvementRate: '0%'
          },
          loading: false
        });
      } else {
        // Show empty state if no data
        setLeaderboard({
          overall: [],
          monthly: [],
          departmental: [],
          metrics: {
            totalParticipants: 0,
            averageScore: 0,
            topDepartment: 'N/A',
            improvementRate: '0%'
          },
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Show empty state on error
      setLeaderboard({
        overall: [],
        monthly: [],
        departmental: [],
        metrics: {
          totalParticipants: 0,
          averageScore: 0,
          topDepartment: 'N/A',
          improvementRate: '0%'
        },
        loading: false
      });
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <Star className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  if (!isHR && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Only HR and Admins can view leaderboards.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">Recognize and celebrate top performers</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'overall' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overall')}
            size="sm"
          >
            Overall
          </Button>
          <Button 
            variant={activeTab === 'monthly' ? 'default' : 'outline'}
            onClick={() => setActiveTab('monthly')}
            size="sm"
          >
            Monthly
          </Button>
          <Button 
            variant={activeTab === 'departmental' ? 'default' : 'outline'}
            onClick={() => setActiveTab('departmental')}
            size="sm"
          >
            By Department
          </Button>
        </div>
      </div>

      {leaderboard.loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  Total Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.metrics.totalParticipants}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.metrics.averageScore}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                  Top Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{leaderboard.metrics.topDepartment}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                  Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{leaderboard.metrics.improvementRate}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top 3 Podium */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 Champions Podium</CardTitle>
              <CardDescription>This period's top performers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-end space-x-8 py-8">
                {/* Second Place */}
                {leaderboard.overall[1] && (
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto">
                        {leaderboard.overall[1].avatar}
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Medal className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <p className="font-bold text-lg">{leaderboard.overall[1].name}</p>
                    <p className="text-sm text-muted-foreground">{leaderboard.overall[1].department}</p>
                    <p className="text-xl font-bold text-gray-500">{leaderboard.overall[1].score}</p>
                    <div className="bg-gray-100 h-16 mt-2 rounded-t-lg flex items-end justify-center">
                      <span className="text-2xl font-bold text-gray-600 mb-2">2</span>
                    </div>
                  </div>
                )}

                {/* First Place */}
                {leaderboard.overall[0] && (
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl mb-2 mx-auto">
                        {leaderboard.overall[0].avatar}
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Crown className="h-10 w-10 text-yellow-500" />
                      </div>
                    </div>
                    <p className="font-bold text-xl">{leaderboard.overall[0].name}</p>
                    <p className="text-sm text-muted-foreground">{leaderboard.overall[0].department}</p>
                    <p className="text-2xl font-bold text-yellow-600">{leaderboard.overall[0].score}</p>
                    <div className="bg-yellow-100 h-24 mt-2 rounded-t-lg flex items-end justify-center">
                      <span className="text-3xl font-bold text-yellow-600 mb-2">1</span>
                    </div>
                  </div>
                )}

                {/* Third Place */}
                {leaderboard.overall[2] && (
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto">
                        {leaderboard.overall[2].avatar}
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Award className="h-8 w-8 text-amber-600" />
                      </div>
                    </div>
                    <p className="font-bold text-lg">{leaderboard.overall[2].name}</p>
                    <p className="text-sm text-muted-foreground">{leaderboard.overall[2].department}</p>
                    <p className="text-xl font-bold text-amber-600">{leaderboard.overall[2].score}</p>
                    <div className="bg-amber-100 h-12 mt-2 rounded-t-lg flex items-end justify-center">
                      <span className="text-2xl font-bold text-amber-600 mb-2">3</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>Full Rankings</CardTitle>
              <CardDescription>Complete leaderboard standings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.overall.map((employee) => (
                  <div 
                    key={employee.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      employee.rank <= 3 ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                        {getRankIcon(employee.rank)}
                      </div>
                      <div className="text-3xl">{employee.avatar}</div>
                      <div>
                        <p className="font-semibold text-lg">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                        <div className="flex space-x-1 mt-1">
                          {employee.badges.map((badge, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{employee.score}</p>
                      <p className="text-sm text-muted-foreground">Points</p>
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm mt-1 ${getRankColor(employee.rank)}`}>
                        #{employee.rank}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;

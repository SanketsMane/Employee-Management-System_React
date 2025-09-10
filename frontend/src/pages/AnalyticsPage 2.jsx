import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';
import api from '../lib/api';

const AnalyticsPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [analytics, setAnalytics] = useState({
    overview: {},
    attendance: {},
    leaves: {},
    productivity: {},
    loading: true
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));
      
      // Fetch various analytics data
      const [overviewRes, attendanceRes, leavesRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/attendance'),
        api.get('/analytics/leaves')
      ]);

      setAnalytics({
        overview: overviewRes.data.data || {},
        attendance: attendanceRes.data.data || {},
        leaves: leavesRes.data.data || {},
        productivity: {}, // Will be implemented later
        loading: false
      });
    } catch (error) {
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  };

  if (!isHR && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Only HR and Admins can view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights and reports</p>
      </div>

      {analytics.loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  Avg Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">+1.2% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                  Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">12 pending approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                  Productivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Above target</p>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Charts and Analytics */}
          <AnalyticsCharts />
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'New employee onboarded', user: 'John Doe', time: '2 hours ago', type: 'success' },
                    { action: 'Leave request submitted', user: 'Jane Smith', time: '4 hours ago', type: 'info' },
                    { action: 'Attendance marked late', user: 'Bob Johnson', time: '1 day ago', type: 'warning' },
                    { action: 'Performance review completed', user: 'Alice Brown', time: '2 days ago', type: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Top Performers
                </CardTitle>
                <CardDescription>This month's standout employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Wilson', dept: 'Engineering', score: 98, badge: '🥇' },
                    { name: 'Mike Chen', dept: 'Marketing', score: 95, badge: '🥈' },
                    { name: 'Emily Davis', dept: 'Sales', score: 92, badge: '🥉' },
                    { name: 'Alex Thompson', dept: 'Design', score: 90, badge: '⭐' }
                  ].map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{performer.badge}</span>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-muted-foreground">{performer.dept}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{performer.score}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;

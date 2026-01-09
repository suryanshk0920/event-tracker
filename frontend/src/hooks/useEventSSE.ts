'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface AttendanceData {
    attendance: {
        id: number;
        event_id: number;
        user_id: number;
        timestamp: string;
    };
    user: {
        id: number;
        name: string;
        email: string;
        roll_no: string | null;
        division: string | null;
        department: string | null;
    };
}

interface SSEEvent {
    type: 'connected' | 'new_attendance' | 'error';
    message?: string;
    data?: AttendanceData;
    timestamp: string;
}

interface UseEventSSEReturn {
    isConnected: boolean;
    lastUpdate: Date | null;
    error: string | null;
    newAttendee: AttendanceData | null;
    connectionAttempts: number;
}

export function useEventSSE(eventId: number | null): UseEventSSEReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [newAttendee, setNewAttendee] = useState<AttendanceData | null>(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    const cleanup = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!eventId || !isMountedRef.current) return;

        cleanup();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const url = `${apiUrl}/api/events/${eventId}/attendance-stream`;

            // EventSource doesn't support custom headers, so we pass token as query param
            const urlWithAuth = `${url}?token=${encodeURIComponent(token)}`;

            const eventSource = new EventSource(urlWithAuth);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                if (isMountedRef.current) {
                    setIsConnected(true);
                    setError(null);
                    setConnectionAttempts(0);
                    console.log(`SSE connected to event ${eventId}`);
                }
            };

            eventSource.onmessage = (event) => {
                if (!isMountedRef.current) return;

                try {
                    const data: SSEEvent = JSON.parse(event.data);

                    if (data.type === 'connected') {
                        console.log('SSE connection confirmed:', data.message);
                    } else if (data.type === 'new_attendance' && data.data) {
                        console.log('New attendance received:', data.data);
                        setNewAttendee(data.data);
                        setLastUpdate(new Date(data.timestamp));
                    }
                } catch (err) {
                    console.error('Error parsing SSE data:', err);
                }
            };

            eventSource.onerror = (err) => {
                console.error('SSE connection error:', err);

                if (isMountedRef.current) {
                    setIsConnected(false);

                    // Don't retry too many times
                    if (connectionAttempts < 5) {
                        setConnectionAttempts(prev => prev + 1);
                        setError(`Connection lost. Reconnecting... (attempt ${connectionAttempts + 1}/5)`);

                        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                        const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 16000);

                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (isMountedRef.current) {
                                connect();
                            }
                        }, delay);
                    } else {
                        setError('Failed to establish connection. Please refresh the page.');
                    }
                }

                cleanup();
            };
        } catch (err) {
            console.error('Error creating SSE connection:', err);
            setError('Failed to connect to event stream');
            setIsConnected(false);
        }
    }, [eventId, connectionAttempts, cleanup]);

    // Initial connection
    useEffect(() => {
        isMountedRef.current = true;
        connect();

        return () => {
            isMountedRef.current = false;
            cleanup();
        };
    }, [connect, cleanup]);

    return {
        isConnected,
        lastUpdate,
        error,
        newAttendee,
        connectionAttempts
    };
}

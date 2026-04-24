import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VideoCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category_id: string | null;
  is_published: boolean;
  sort_order: number;
}

export interface VideoLesson {
  id: string;
  playlist_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  difficulty: string;
  xp_reward: number;
  extra_material_url: string | null;
  sort_order: number;
}

export interface PlaylistWithStats extends VideoPlaylist {
  category?: VideoCategory | null;
  totalLessons: number;
  completedLessons: number;
}

export interface PlaylistDetail extends VideoPlaylist {
  category: VideoCategory | null;
  lessons: VideoLesson[];
}

/** Lista categorias e playlists com progresso. */
export function useVideoOverview() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catsRes, plRes] = await Promise.all([
      supabase.from("video_categories").select("*").order("sort_order"),
      supabase.from("video_playlists").select("*").eq("is_published", true).order("sort_order"),
    ]);

    const cats = (catsRes.data || []) as VideoCategory[];
    const pls = (plRes.data || []) as VideoPlaylist[];
    setCategories(cats);

    if (pls.length === 0) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    // Lessons por playlist
    const { data: lessonsData } = await supabase
      .from("video_lessons")
      .select("id, playlist_id");
    const lessonsByPl: Record<string, string[]> = {};
    (lessonsData || []).forEach((l: any) => {
      if (!l.playlist_id) return;
      if (!lessonsByPl[l.playlist_id]) lessonsByPl[l.playlist_id] = [];
      lessonsByPl[l.playlist_id].push(l.id);
    });

    // Conclusões do usuário
    let completedSet = new Set<string>();
    if (user) {
      const allLessonIds = (lessonsData || []).map((l: any) => l.id);
      if (allLessonIds.length > 0) {
        const { data: comp } = await supabase
          .from("video_completions")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in("lesson_id", allLessonIds);
        completedSet = new Set((comp || []).map((c: any) => c.lesson_id));
      }
    }

    const catMap: Record<string, VideoCategory> = {};
    cats.forEach((c) => { catMap[c.id] = c; });

    const enriched: PlaylistWithStats[] = pls.map((p) => {
      const ids = lessonsByPl[p.id] || [];
      const completed = ids.filter((id) => completedSet.has(id)).length;
      return {
        ...p,
        category: p.category_id ? catMap[p.category_id] || null : null,
        totalLessons: ids.length,
        completedLessons: completed,
      };
    });
    setPlaylists(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { categories, playlists, loading, refetch: fetchAll };
}

/** Detalhe de uma playlist com aulas e set de concluídas. */
export function usePlaylistDetail(playlistId: string | undefined) {
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!playlistId) return;
    setLoading(true);

    const { data: pData } = await supabase
      .from("video_playlists")
      .select("*")
      .eq("id", playlistId)
      .maybeSingle();

    if (!pData) {
      setPlaylist(null);
      setLoading(false);
      return;
    }

    let category: VideoCategory | null = null;
    if ((pData as any).category_id) {
      const { data: cat } = await supabase
        .from("video_categories")
        .select("*")
        .eq("id", (pData as any).category_id)
        .maybeSingle();
      category = (cat as VideoCategory) || null;
    }

    const { data: lessonsData } = await supabase
      .from("video_lessons")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("sort_order");

    const lessons = (lessonsData || []) as VideoLesson[];
    setPlaylist({ ...(pData as any), category, lessons });

    if (user && lessons.length > 0) {
      const { data: comp } = await supabase
        .from("video_completions")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessons.map((l) => l.id));
      setCompletedIds(new Set((comp || []).map((c: any) => c.lesson_id)));
    } else {
      setCompletedIds(new Set());
    }
    setLoading(false);
  }, [playlistId, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { playlist, completedIds, loading, refetch: fetchAll };
}

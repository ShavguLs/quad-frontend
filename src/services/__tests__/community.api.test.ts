import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { CommunityPost, CommunityPostComment, PaginatedResponse } from '../../types';

// Mock import.meta.env
const mockEnv = {
  VITE_API_BASE_URL: 'https://api.example.com',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

// Import api after mocks
import { api } from '../api';

describe('Community API', () => {
  let fetchSpy: Mock;

  const mockPost: CommunityPost = {
    id: '1',
    author: 'Test Author',
    handle: 'testauthor',
    avatar: 'https://example.com/avatar.jpg',
    content: 'Test post content',
    image: 'https://example.com/image.jpg',
    timestamp: '2024-01-01T00:00:00Z',
    likes: 10,
    comments: 5,
    category: 'discussion',
    is_saved: false,
    is_liked: false,
    recent_comments: [],
  };

  const mockComment: CommunityPostComment = {
    id: '1',
    author: 'Commenter',
    handle: 'commenter',
    avatar: 'https://example.com/commenter.jpg',
    content: 'Test comment',
    createdAt: '2024-01-01T00:00:00Z',
    parent: null,
  };

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCommunityPosts', () => {
    it('should fetch posts with default pagination', async () => {
      const mockResponse: PaginatedResponse<CommunityPost> = {
        count: 2,
        next: null,
        previous: null,
        results: [mockPost, { ...mockPost, id: '2' }],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      } as Response);

      const result = await api.getCommunityPosts();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/?page=1&page_size=20'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
      expect(result.results).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.next).toBeNull();
      expect(result.previous).toBeNull();
    });

    it('should fetch posts with custom page and page size', async () => {
      const mockResponse: PaginatedResponse<CommunityPost> = {
        count: 50,
        next: 'https://api.example.com/community/posts/?page=3',
        previous: 'https://api.example.com/community/posts/?page=1',
        results: [mockPost],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      } as Response);

      const result = await api.getCommunityPosts(2, 10);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/?page=2&page_size=10'),
        expect.any(Object)
      );
      expect(result.next).toBe(mockResponse.next);
      expect(result.previous).toBe(mockResponse.previous);
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getCommunityPosts()).rejects.toThrow('Network error');
    });

    it('should handle 401 errors with token refresh', async () => {
      const mockResponse: PaginatedResponse<CommunityPost> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockPost],
      };

      fetchSpy
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: 'Token expired' }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ access: 'new-token' }),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
          headers: new Headers(),
        } as Response);

      const result = await api.getCommunityPosts();

      expect(result.results).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  describe('createCommunityPost', () => {
    it('should create a new post with required fields', async () => {
      const newPost = { content: 'New post content', category: 'announcement' };
      const mockCreatedPost: CommunityPost = {
        ...mockPost,
        id: 'new-id',
        content: newPost.content,
        category: newPost.category,
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockCreatedPost),
        headers: new Headers(),
      } as Response);

      const result = await api.createCommunityPost(newPost);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPost),
          credentials: 'include',
        })
      );
      expect(result.content).toBe(newPost.content);
      expect(result.category).toBe(newPost.category);
    });

    it('should create a post with image_url', async () => {
      const newPost = {
        content: 'Post with image',
        category: 'art',
        image_url: 'https://example.com/art.jpg',
      };
      const mockCreatedPost: CommunityPost = {
        ...mockPost,
        id: 'new-id',
        ...newPost,
        image: newPost.image_url,
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockCreatedPost),
        headers: new Headers(),
      } as Response);

      const result = await api.createCommunityPost(newPost);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/'),
        expect.objectContaining({
          body: JSON.stringify(newPost),
        })
      );
      expect(result.image).toBe(newPost.image_url);
    });

    it('should handle validation errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Content is required' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(
        api.createCommunityPost({ content: '' })
      ).rejects.toThrow('Content is required');
    });
  });

  describe('getPostComments', () => {
    it('should fetch comments for a post', async () => {
      const mockResponse: PaginatedResponse<CommunityPostComment> = {
        count: 2,
        next: null,
        previous: null,
        results: [mockComment, { ...mockComment, id: '2' }],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      } as Response);

      const result = await api.getPostComments('post-123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/comments/?page=1&page_size=20'),
        expect.any(Object)
      );
      expect(result.results).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should fetch comments with custom pagination', async () => {
      const mockResponse: PaginatedResponse<CommunityPostComment> = {
        count: 100,
        next: 'https://api.example.com/next',
        previous: null,
        results: [mockComment],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      } as Response);

      const result = await api.getPostComments('post-123', 3, 50);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/comments/?page=3&page_size=50'),
        expect.any(Object)
      );
      expect(result.results).toHaveLength(1);
    });

    it('should handle numeric post IDs', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            count: 0,
            next: null,
            previous: null,
            results: [],
          }),
        headers: new Headers(),
      } as Response);

      await api.getPostComments(123);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/123/comments/'),
        expect.any(Object)
      );
    });
  });

  describe('createPostComment', () => {
    it('should create a top-level comment', async () => {
      const content = 'This is a comment';
      const mockCreatedComment: CommunityPostComment = {
        ...mockComment,
        id: 'new-comment',
        content,
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockCreatedComment),
        headers: new Headers(),
      } as Response);

      const result = await api.createPostComment('post-123', content);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/comments/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content, parent: null }),
          credentials: 'include',
        })
      );
      expect(result.content).toBe(content);
      expect(result.parent).toBeNull();
    });

    it('should create a reply comment with parent', async () => {
      const content = 'This is a reply';
      const parentId = 'parent-comment-123';
      const mockCreatedComment: CommunityPostComment = {
        ...mockComment,
        id: 'reply-comment',
        content,
        parent: parentId,
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockCreatedComment),
        headers: new Headers(),
      } as Response);

      const result = await api.createPostComment('post-123', content, parentId);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/comments/'),
        expect.objectContaining({
          body: JSON.stringify({ content, parent: parentId }),
        })
      );
      expect(result.parent).toBe(parentId);
    });

    it('should handle null parent explicitly', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockComment),
        headers: new Headers(),
      } as Response);

      await api.createPostComment('post-123', 'test', null);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ content: 'test', parent: null }),
        })
      );
    });
  });

  describe('deleteCommunityPost', () => {
    it('should delete a post by ID', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await api.deleteCommunityPost('post-123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle numeric post IDs', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await api.deleteCommunityPost(456);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/456/'),
        expect.any(Object)
      );
    });

    it('should handle 403 error for unauthorized deletion', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: 'You can only delete your own posts' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(api.deleteCommunityPost('post-123')).rejects.toThrow(
        'You can only delete your own posts'
      );
    });
  });

  describe('saveCommunityPost', () => {
    it('should save a post', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'saved' }),
        headers: new Headers(),
      } as Response);

      const result = await api.saveCommunityPost('post-123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/save_post/'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.status).toBe('saved');
    });

    it('should handle already saved post with 200 OK (idempotent)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'Post already saved' }),
        headers: new Headers(),
      } as Response);
      const result = await api.saveCommunityPost('post-123');
      expect(result.status).toBe('Post already saved');
    });
  });

  describe('unsaveCommunityPost', () => {
    it('should unsave a post', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await api.unsaveCommunityPost('post-123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/unsave_post/'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle unsaving a post that was not saved', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Post not found in saved items' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(api.unsaveCommunityPost('post-123')).rejects.toThrow(
        'Post not found in saved items'
      );
    });
  });

  describe('getSavedCommunityPosts', () => {
    it('should fetch saved posts', async () => {
      const mockResponse: PaginatedResponse<CommunityPost> = {
        count: 2,
        next: null,
        previous: null,
        results: [
          { ...mockPost, id: '1', is_saved: true },
          { ...mockPost, id: '2', is_saved: true },
        ],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      } as Response);

      const result = await api.getSavedCommunityPosts();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/saved/'),
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
      expect(result[0].is_saved).toBe(true);
    });

    it('should return empty array when no saved posts', async () => {
      const mockResponse: PaginatedResponse<CommunityPost> = {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers(),
      } as Response);

      const result = await api.getSavedCommunityPosts();

      expect(result).toEqual([]);
    });
  });

  describe('likeCommunityPost', () => {
    it('should like a post and return updated likes count', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ status: 'Post liked', likes: 11 }),
        headers: new Headers(),
      } as Response);

      const result = await api.likeCommunityPost('post-123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/like_post/'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.status).toBe('Post liked');
      expect(result.likes).toBe(11);
    });

    it('should handle liking already liked post with 200 OK (idempotent)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'Post already liked', likes: 10 }),
        headers: new Headers(),
      } as Response);

      const result = await api.likeCommunityPost('post-123');
      expect(result.status).toBe('Post already liked');
      expect(result.likes).toBe(10);
    });
  });

  describe('unlikeCommunityPost', () => {
    it('should unlike a post and return updated likes count', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'unliked', likes: 9 }),
        headers: new Headers(),
      } as Response);

      const result = await api.unlikeCommunityPost('post-123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/community/posts/post-123/unlike_post/'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.status).toBe('unliked');
      expect(result.likes).toBe(9);
    });

    it('should handle unliking a post that was not liked', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Like not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(api.unlikeCommunityPost('post-123')).rejects.toThrow('Like not found');
    });
  });

  describe('error handling', () => {
    it('should handle non-JSON error responses', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
        headers: new Headers(),
      } as Response);

      await expect(api.getCommunityPosts()).rejects.toThrow('Internal Server Error');
    });

    it('should handle empty error responses', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response);

      // When error body is an empty string, the API returns the empty string
      await expect(api.getCommunityPosts()).rejects.toThrow('');
    });

    it('should prioritize error over message over detail', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'Custom error',
            message: 'Message text',
            detail: 'Detail text',
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(api.getCommunityPosts()).rejects.toThrow('Custom error');
    });
  });
});

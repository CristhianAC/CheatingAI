import { request } from '$lib/api.js';

export function createExam(data) {
  return request('POST', '/exams/', data);
}

export function listExams() {
  return request('GET', '/exams/');
}

export function verifyExamCode(code) {
  return request('POST', '/exams/verify-code', { code });
}

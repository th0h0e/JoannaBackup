import { delay, http, HttpResponse } from 'msw'

const POCKETBASE_URL = 'https://pocketbase-j0ososc8ckcw48sos8w0ccok.kontext.icu'

export const handlers = [
  http.post(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, async () => {
    await delay(100)
    return HttpResponse.json({
      token: 'test-token-12345',
      record: {
        id: 'user-1',
        email: 'admin@example.com',
        created: '2024-01-01 00:00:00',
        updated: '2024-01-01 00:00:00',
      },
    })
  }),

  http.get(`${POCKETBASE_URL}/api/collections/Portfolio_Projects/records`, async () => {
    await delay(50)
    return HttpResponse.json({
      page: 1,
      perPage: 50,
      totalItems: 2,
      totalPages: 1,
      items: [
        {
          id: 'project-1',
          Title: 'Test Project One',
          Description: 'Description for project one',
          Images: ['image1.jpg', 'image2.jpg'],
          Order: 1,
          Responsibility: ['CREATIVE PRODUCTION'],
          Responsibility_json: ['CREATIVE PRODUCTION'],
          created: '2024-01-01 00:00:00',
          updated: '2024-01-01 00:00:00',
        },
        {
          id: 'project-2',
          Title: 'Test Project Two',
          Description: 'Description for project two',
          Images: ['image3.jpg'],
          Order: 2,
          Responsibility: ['ARTIST HANDLING'],
          Responsibility_json: ['ARTIST HANDLING'],
          created: '2024-01-01 00:00:00',
          updated: '2024-01-01 00:00:00',
        },
      ],
    })
  }),

  http.post(`${POCKETBASE_URL}/api/collections/Portfolio_Projects/records`, async () => {
    await delay(100)
    return HttpResponse.json({
      id: 'project-new',
      Title: 'New Project',
      Description: 'New project description',
      Images: [],
      Order: 3,
      created: '2024-01-02 00:00:00',
      updated: '2024-01-02 00:00:00',
    })
  }),

  http.patch(`${POCKETBASE_URL}/api/collections/Portfolio_Projects/records/:id`, async ({ params }) => {
    await delay(100)
    return HttpResponse.json({
      id: params.id,
      Title: 'Updated Project',
      updated: '2024-01-03 00:00:00',
    })
  }),

  http.delete(`${POCKETBASE_URL}/api/collections/Portfolio_Projects/records/:id`, async () => {
    await delay(50)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${POCKETBASE_URL}/api/collections/Homepage/records`, async () => {
    await delay(50)
    return HttpResponse.json({
      items: [{
        id: 'homepage-1',
        Hero_Title: 'Creative Strategy and Communication',
        Hero_Image: 'hero.jpg',
        Is_Active: true,
      }],
    })
  }),

  http.get(`${POCKETBASE_URL}/api/collections/Settings/records`, async () => {
    await delay(50)
    return HttpResponse.json({
      items: [{
        id: 'settings-1',
        Show_Top_Progress_Bar: true,
        Mobile_Font_Size: 1.25,
        Tablet_Font_Size: 1.875,
        Desktop_Font_Size: 2.25,
        Large_Desktop_Font_Size: 3,
      }],
    })
  }),

  http.get(`${POCKETBASE_URL}/api/collections/About/records`, async () => {
    await delay(50)
    return HttpResponse.json({
      items: [{
        id: 'about-1',
        About_Description: 'Test about description',
        Expertise_Description: 'Test expertise',
        Client_List_Json: ['NIKE', 'ADIDAS'],
        Contact_Email: 'test@example.com',
        Is_Active: true,
      }],
    })
  }),
]

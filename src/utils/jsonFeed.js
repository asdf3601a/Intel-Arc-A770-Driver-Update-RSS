export function jsonFeed(title, homepage, items) {
    return {    
        'version': 'https://jsonfeed.org/version/1',
        'title': title,
        'home_page_url': homepage,
        'items': items
    }
}

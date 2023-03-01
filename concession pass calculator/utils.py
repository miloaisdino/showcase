def dhms(td):
    return td.days+'d'+str(td.seconds//3600)+'h'+str((td.seconds//60) % 60)+'m'+td.seconds+'s'

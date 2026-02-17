def get_user_input():
    print("\n=== NAF PHYSICAL FITNESS TEST CALCULATOR ===\n")

    class Data:
        pass

    d = Data()
    d.year         = input("Year").strip()
    d.full_name    = input("Full Name: ").strip()
    d.rank         = input("Rank: ").strip()
    d.svc_no       = input("Service Number: ").strip()
    d.unit         = input("Unit: ").strip()
    d.appointment  = input("Appointment: ").strip()
    d.date = input("Date (mm-dd-yyyy): ").strip()

    while True:
        email = input("Email Address: ").strip()
        if "@" in email and "." in email.split("@")[-1] and len(email) > 5:
            d.email = email
            break
        print("Please enter a valid email address (e.g. name@example.com).")

    while True:
        try:
            d.age = int(input("Age: ").strip())
            if d.age > 0: break
        except:
            pass
        print("Enter valid age.")


    while True:
        sex = input("Sex (male/female): ").strip().lower()
        if sex in ["male", "female"]:
            d.sex = sex
            break
        print("Enter 'male' or 'female'.")

    while True:
        try:
            d.height = float(input("Height (meters, e.g. 1.75): ").strip())
            if d.height > 0: break
        except:
            print("Enter valid height.")

    while True:
        try:
            d.weight = float(input("Weight (kg): ").strip())
            if d.weight > 0: break
        except:
            print("Enter valid weight.")

    cardio_type_hint = "jog" if (d.age < 29) else "walk"
    print(f"\nCardio test for your age group: {cardio_type_hint.upper()}")

    while True:
        try:
            mins = int(input("Cardio time - Minutes: ").strip())
            if mins >= 0: break
        except:
            pass
        print("Enter valid minutes.")

    while True:
        try:
            secs = int(input("Cardio time - Seconds (0-59): ").strip())
            if 0 <= secs <= 59: break
        except:
            pass
        print("Seconds 0-59.")

    d.cardio_minutes = mins
    d.cardio_seconds = secs

    d.step_up   = int(input("3-Minute Step-Up (reps):   ").strip() or 0)
    d.push_up   = int(input("1-Minute Push-Up (reps):   ").strip() or 0)
    d.sit_up    = int(input("1-Minute Sit-Up (reps):    ").strip() or 0)
    d.chin_up   = int(input("Chin-Up / Arm Hang (reps): ").strip() or 0)
    d.sit_reach = int(input("Sit & Reach (cm):          ").strip() or 0)

    return d